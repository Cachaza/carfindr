package cochesnet

import (
	"bytes"
	"context"
	"encoding/json" // Ensure this is imported
	"fmt"
	"io"
	"log"
	"net/http"
	"strconv"

	//"strings" // May not be needed now
	"time"

	//"github.com/cachaza/searchNotifier/internal/common"
	"github.com/cachaza/searchNotifier/internal/searcher" // Correct import path
)

// Constants remain the same
const (
	sourceName = "cochesnet"
	apiBaseURL = "https://web.gw.coches.net/search/listing"
)

// --- Structs for Coches.net API Request & Response ---

// CochesNetRequestPayload remains the same (defines the structure we send)
type CochesNetRequestPayload struct {
	// ... (keep definition as before) ...
	Pagination struct {
		Page int `json:"page"`
		Size int `json:"size"`
	} `json:"pagination"`
	Sort struct {
		Order string `json:"order"`
		Term  string `json:"term"`
	} `json:"sort"`
	Filters struct {
		IsFinanced         *bool       `json:"isFinanced,omitempty"`
		Price              *PriceRange `json:"price,omitempty"`
		BodyTypeIDs        []int       `json:"bodyTypeIds,omitempty"`
		Categories         *Categories `json:"categories,omitempty"`
		ContractID         *int        `json:"contractId,omitempty"`
		DrivenWheelsIDs    []int       `json:"drivenWheelsIds,omitempty"`
		FuelTypeIDs        []int       `json:"fuelTypeIds,omitempty"`
		HasPhoto           *bool       `json:"hasPhoto,omitempty"`
		HasStock           *bool       `json:"hasStock,omitempty"`
		HasWarranty        *bool       `json:"hasWarranty,omitempty"`
		IsCertified        *bool       `json:"isCertified,omitempty"`
		Km                 *KmRange    `json:"km,omitempty"`
		OnlyPeninsula      *bool       `json:"onlyPeninsula,omitempty"`
		OfferTypeIDs       []int       `json:"offerTypeIds,omitempty"`
		ProvinceIDs        []int       `json:"provinceIds,omitempty"`
		SearchText         *string     `json:"searchText,omitempty"`
		SellerTypeID       *int        `json:"sellerTypeId,omitempty"`
		TransmissionTypeID *int        `json:"transmissionTypeId,omitempty"`
		Vehicles           []Vehicle   `json:"vehicles,omitempty"`
		Year               *YearRange  `json:"year,omitempty"`
	} `json:"filters"`
}
type PriceRange struct {
	From *int `json:"from,omitempty"` // Convert string price?
	To   *int `json:"to,omitempty"`
}
type KmRange struct {
	From *int `json:"from,omitempty"` // Convert string km?
	To   *int `json:"to,omitempty"`
}
type YearRange struct {
	From *int `json:"from,omitempty"` // Convert string year?
	To   *int `json:"to,omitempty"`
}
type Categories struct {
	Category1IDs []int `json:"category1Ids,omitempty"` // [2500]?
}
type Vehicle struct {
	Make    string `json:"make"`
	MakeID  string `json:"makeId"` // Often 0 if make/model text is used
	Model   string `json:"model"`
	ModelID string `json:"modelId"` // Often 0
}

// CochesNetResponse structure for DECODING
type CochesNetResponse struct {
	// Items now holds raw messages temporarily before we re-marshal individually
	Items      []json.RawMessage `json:"items"` // Decode items as raw JSON initially
	Pagination struct {
		Page         int `json:"page"`
		Size         int `json:"size"`
		TotalResults int `json:"totalResults"`
		TotalPages   int `json:"totalPages"`
	} `json:"pagination"`
}

// --- Client Implementation ---

type Client struct {
	httpClient *http.Client
}

func NewClient() *Client {
	return &Client{
		httpClient: &http.Client{Timeout: 15 * time.Second},
	}
}

func (c *Client) SourceName() string {
	return sourceName
}

// Search method now returns []json.RawMessage
func (c *Client) Search(ctx context.Context, params *searcher.UnifiedSearchRequest) ([]json.RawMessage, map[string]interface{}, error) {
	log.Printf("[%s] Starting search", sourceName)

	currentPage := 1
	if params.CochesNetPage != nil && *params.CochesNetPage > 0 {
		currentPage = *params.CochesNetPage
	}

	payload, err := buildCochesNetPayload(params, currentPage) // build payload logic remains same
	if err != nil {
		return nil, nil, fmt.Errorf("[%s] failed to build request payload: %w", sourceName, err)
	}

	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		return nil, nil, fmt.Errorf("[%s] failed to marshal payload: %w", sourceName, err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", apiBaseURL, bytes.NewBuffer(payloadBytes))
	if err != nil {
		return nil, nil, fmt.Errorf("[%s] failed to create request: %w", sourceName, err)
	}

	setCochesNetHeaders(req)

	log.Printf("[%s] Requesting Page %d. URL: %s", sourceName, currentPage, req.URL.String())

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, nil, fmt.Errorf("[%s] request failed: %w", sourceName, err)
	}
	defer resp.Body.Close()

	log.Printf("[%s] Response Status: %s", sourceName, resp.Status)

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return nil, nil, fmt.Errorf("[%s] request failed, status %d: %s", sourceName, resp.StatusCode, string(bodyBytes))
	}

	// Decode the overall structure, keeping items as raw messages
	var apiResp CochesNetResponse
	if err := json.NewDecoder(resp.Body).Decode(&apiResp); err != nil {
		// Try reading body for logging if decode fails
		// Note: This might consume the body if the error wasn't immediate
		resp.Body.Close() // Close original reader
		// Re-read attempt (might not work depending on error)
		// Or log the error more directly
		return nil, nil, fmt.Errorf("[%s] failed to decode response structure: %w", sourceName, err)
	}

	log.Printf("[%s] Received %d raw items. TotalResults: %d", sourceName, len(apiResp.Items), apiResp.Pagination.TotalResults)

	// The apiResp.Items are already []json.RawMessage, so no further processing needed here!
	rawCars := apiResp.Items

	// --- Pagination ---
	var nextPageData map[string]interface{}
	if currentPage < apiResp.Pagination.TotalPages && len(apiResp.Items) > 0 {
		nextPage := currentPage + 1
		nextPageData = map[string]interface{}{
			"cochesNetPage": nextPage,
		}
		log.Printf("[%s] Next page available: %d", sourceName, nextPage)
	} else {
		log.Printf("[%s] No more pages available.", sourceName)
	}

	return rawCars, nextPageData, nil
}

// REMOVE the normalizeCochesNetCar function

// --- buildCochesNetPayload, setCochesNetHeaders, parseIntPtr, intPtr remain the same ---
// These helpers are still needed to construct the request payload and headers.

func buildCochesNetPayload(params *searcher.UnifiedSearchRequest, page int) (*CochesNetRequestPayload, error) {
	payload := &CochesNetRequestPayload{}
	payload.Pagination.Page = page
	payload.Pagination.Size = 30
	payload.Sort.Order = "desc"
	payload.Sort.Term = "year" // Es como cocjhes net ordena por mas reciente
	payload.Filters.OfferTypeIDs = []int{0, 1, 2, 3, 4, 5}
	payload.Filters.ContractID = intPtr(0)
	payload.Filters.SellerTypeID = intPtr(0)
	payload.Filters.Categories = &Categories{Category1IDs: []int{2500}}

	if params.IsFinanced != nil {
		payload.Filters.IsFinanced = params.IsFinanced
	}
	if params.HasPhoto != nil {
		payload.Filters.HasPhoto = params.HasPhoto
	}
	if params.HasWarranty != nil {
		payload.Filters.HasWarranty = params.HasWarranty
	}
	// Handle isCertified, defaulting to false if nil
	isCert := false
	if params.IsCertified != nil {
		isCert = *params.IsCertified
	}
	payload.Filters.IsCertified = &isCert

	if params.Keywords != nil {
		payload.Filters.SearchText = params.Keywords
	}

	payload.Filters.Price = &PriceRange{}
	payload.Filters.Price.From, _ = parseIntPtr(params.PriceFrom)
	payload.Filters.Price.To, _ = parseIntPtr(params.PriceTo)
	if payload.Filters.Price.From == nil && payload.Filters.Price.To == nil {
		payload.Filters.Price = nil
	}

	payload.Filters.Km = &KmRange{}
	payload.Filters.Km.From, _ = parseIntPtr(params.KmFrom)
	payload.Filters.Km.To, _ = parseIntPtr(params.KmTo)
	if payload.Filters.Km.From == nil && payload.Filters.Km.To == nil {
		payload.Filters.Km = nil
	}

	payload.Filters.Year = &YearRange{}
	payload.Filters.Year.From, _ = parseIntPtr(params.YearFrom)
	payload.Filters.Year.To, _ = parseIntPtr(params.YearTo)
	if payload.Filters.Year.From == nil && payload.Filters.Year.To == nil {
		payload.Filters.Year = nil
	}

	if len(params.BodyTypeIDs) > 0 {
		payload.Filters.BodyTypeIDs = params.BodyTypeIDs
	}
	if len(params.DrivenWheelsIDs) > 0 {
		payload.Filters.DrivenWheelsIDs = params.DrivenWheelsIDs
	}
	if len(params.ProvinceIDs) > 0 {
		payload.Filters.ProvinceIDs = params.ProvinceIDs
	}

	if params.Brand != nil || params.Model != nil {
		vehicle := Vehicle{}
		if params.Brand != nil {
			vehicle.Make = *params.Brand
		}
		if params.Model != nil {
			vehicle.Model = *params.Model
		}
		vehicle.MakeID = *params.BrandID
		vehicle.ModelID = *params.ModelID
		payload.Filters.Vehicles = []Vehicle{vehicle}
	}

	// Add mappings for FuelTypeIDs and TransmissionTypeID if available
	// if params.FuelType != nil { payload.Filters.FuelTypeIDs = mapFuelTypeToCochesNetIDs(*params.FuelType) }
	if params.TransmissionTypeID != nil {
		payload.Filters.TransmissionTypeID = params.TransmissionTypeID
	}

	log.Printf("[%s] Built payload: %+v", sourceName, payload)

	return payload, nil
}

func setCochesNetHeaders(req *http.Request) {
	req.Header.Set("authority", "web.gw.coches.net")
	req.Header.Set("accept", "application/json, text/plain, */*")
	req.Header.Set("accept-language", "en-US,en;q=0.9")
	req.Header.Set("content-type", "application/json")
	req.Header.Set("dnt", "1")
	req.Header.Set("origin", "https://www.coches.net")
	req.Header.Set("referer", "https://www.coches.net/")
	req.Header.Set("sec-ch-ua", `"Chromium";v="117", "Not;A=Brand";v="8"`)
	req.Header.Set("sec-ch-ua-mobile", "?0")
	req.Header.Set("sec-ch-ua-platform", `"Linux"`)
	req.Header.Set("sec-fetch-dest", "empty")
	req.Header.Set("sec-fetch-mode", "cors")
	req.Header.Set("sec-fetch-site", "same-site")
	req.Header.Set("user-agent", "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36")
	req.Header.Set("x-adevinta-channel", "web-desktop")
	req.Header.Set("x-schibsted-tenant", "coches")
	// Add other static headers if needed
}

func parseIntPtr(s *string) (*int, error) {
	if s == nil || *s == "" {
		return nil, nil
	}
	val, err := strconv.Atoi(*s)
	if err != nil {
		log.Printf("Warning: Failed to parse integer string '%s': %v", *s, err)
		return nil, err
	}
	return &val, nil
}
func intPtr(i int) *int { return &i }

// --- Ensure Client implements Searcher ---
var _ searcher.Searcher = (*Client)(nil)
