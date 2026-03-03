package milanuncios

import (
	"context"
	"encoding/json" // Ensure this is imported
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"strconv"

	//"strings" // May not be needed now
	"time"

	"github.com/cachaza/searchNotifier/internal/searcher" // Correct import path
)

// Constants remain the same
const (
	sourceName = "milanuncios"
	apiBaseURL = "https://searchapi.gw.milanuncios.com/v3/classifieds"
)

// --- Structs for Milanuncios API Response (for DECODING) ---
// Keep the structs needed to decode the overall structure and individual ads before adding photos
type MilanunciosResponse struct {
	Ads        []MilanunciosAd `json:"ads"` // Decode actual ads
	Pagination Pagination      `json:"pagination"`
	Photos     []Photo         `json:"photos"`
}

// MilanunciosAd struct remains as defined before for decoding purposes
type MilanunciosAd struct {
	ID              string      `json:"id"`
	Title           string      `json:"title"`
	Description     string      `json:"description"`
	Price           Price       `json:"price"` // Keep Price struct
	URL             string      `json:"url"`
	Location        Location    `json:"location"`   // Keep Location struct
	Attributes      []Attribute `json:"attributes"` // Keep Attribute struct
	PublicationDate string      `json:"publicationDate"`
	// Add other fields from your TS example if needed for display
}
type Attribute struct {
	Field struct {
		Raw string `json:"raw"` // e.g., "year", "professional_seller", "km"
	} `json:"field"`
	Value struct {
		Raw       string `json:"raw"` // The value as a string
		Formatted string `json:"formatted"`
	} `json:"value"`
}

type Pagination struct {
	NextToken      *string `json:"nextToken"` // Use pointer for optional
	Page           int     `json:"page"`
	ResultsPerPage int     `json:"resultsPerPage"`
	TotalHits      struct {
		Value int `json:"value"`
	} `json:"totalHits"`
}

type Photo struct {
	AdID      string   `json:"adId"`
	ImageUrls []string `json:"imageUrls"`
}

type Price struct {
	Cash struct {
		Value float64 `json:"value"` // Assuming float for price
	} `json:"cash"`
}

type Location struct {
	City struct {
		Name string `json:"name"`
	} `json:"city"`
	Province struct {
		Name string `json:"name"`
	} `json:"province"`
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

	currentOffset := 0
	if params.MilanunciosOffset != nil {
		currentOffset = *params.MilanunciosOffset
	}

	queryParams := buildMilanunciosParams(params, currentOffset) // Build params logic remains

	req, err := http.NewRequestWithContext(ctx, "GET", apiBaseURL, nil)
	if err != nil {
		return nil, nil, fmt.Errorf("[%s] failed to create request: %w", sourceName, err)
	}

	req.URL.RawQuery = queryParams.Encode()
	setMilanunciosHeaders(req)

	log.Printf("[%s] Requesting Offset %d. URL: %s", sourceName, currentOffset, req.URL.String())

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

	// Decode the full response
	var apiResp MilanunciosResponse
	if err := json.NewDecoder(resp.Body).Decode(&apiResp); err != nil {
		return nil, nil, fmt.Errorf("[%s] failed to decode response: %w", sourceName, err)
	}

	log.Printf("[%s] Received %d ads. TotalHits: %d", sourceName, len(apiResp.Ads), apiResp.Pagination.TotalHits.Value)

	// --- Combine Ads and Photos before final marshaling ---
	photosMap := make(map[string][]string)
	for _, p := range apiResp.Photos {
		photosMap[p.AdID] = p.ImageUrls
	}

	// Create the final slice of raw messages
	rawCars := make([]json.RawMessage, 0, len(apiResp.Ads))

	// Temporary struct to hold Ad + Photos for marshaling
	type AdWithPhotos struct {
		MilanunciosAd          // Embed original ad data
		Photos        []string `json:"photo"` // Add the photos field (matches TS example output)
	}

	for _, ad := range apiResp.Ads {
		adPhotos := photosMap[ad.ID] // Get photos for this ad

		// Create the combined structure
		tempAd := AdWithPhotos{
			MilanunciosAd: ad,
			Photos:        adPhotos, // Assign the photo URLs
		}

		// Marshal this combined struct back into JSON bytes
		carBytes, marshalErr := json.Marshal(tempAd)
		if marshalErr != nil {
			log.Printf("[%s] Error marshaling combined ad %s: %v", sourceName, ad.ID, marshalErr)
			continue // Skip this ad
		}

		// Append the raw JSON bytes
		rawCars = append(rawCars, json.RawMessage(carBytes))
	}

	// --- Pagination Logic (remains the same) ---
	var nextPageData map[string]interface{}
	if len(apiResp.Ads) > 0 && apiResp.Pagination.ResultsPerPage > 0 {
		potentialNextOffset := currentOffset + apiResp.Pagination.ResultsPerPage
		if potentialNextOffset < apiResp.Pagination.TotalHits.Value {
			nextPageData = map[string]interface{}{
				"milanunciosOffset": potentialNextOffset,
			}
			log.Printf("[%s] Next offset available: %d", sourceName, potentialNextOffset)
		} else {
			log.Printf("[%s] No more pages available based on offset calculation.", sourceName)
		}
	} else {
		log.Printf("[%s] No more pages available (no results or zero ResultsPerPage).", sourceName)
	}

	return rawCars, nextPageData, nil
}

// REMOVE the normalizeMilanunciosCar function

// --- buildMilanunciosParams and setMilanunciosHeaders remain the same ---
// These helpers are still needed.

func buildMilanunciosParams(params *searcher.UnifiedSearchRequest, offset int) url.Values {
	q := url.Values{}
	q.Set("category", "13")
	q.Set("transaction", "supply")
	q.Set("limit", "30")
	q.Set("sort", "date_desc") // Keep consistent sort order
	q.Set("offset", strconv.Itoa(offset))

	if params.Brand != nil {
		q.Set("brand", *params.Brand)
	}
	if params.Model != nil {
		q.Set("model", *params.Model)
	}
	if params.SellerType != nil {
		q.Set("sellerType", *params.SellerType)
	}
	if params.PriceFrom != nil {
		q.Set("priceFrom", *params.PriceFrom)
	}
	if params.PriceTo != nil {
		q.Set("priceTo", *params.PriceTo)
	}
	if params.KmFrom != nil {
		q.Set("kilometersFrom", *params.KmFrom)
	}
	if params.KmTo != nil {
		q.Set("kilometersTo", *params.KmTo)
	}
	if params.YearFrom != nil {
		q.Set("yearFrom", *params.YearFrom)
	}
	if params.YearTo != nil {
		q.Set("yearTo", *params.YearTo)
	}
	if params.Transmission != nil {
		q.Set("transmission", *params.Transmission)
	}
	if params.FuelType != nil {
		q.Set("fuel", *params.FuelType)
	}
	if params.Doors != nil {
		q.Set("doors", *params.Doors)
	}
	if params.Keywords != nil {
		q.Set("text", *params.Keywords)
	}
	return q
}

func setMilanunciosHeaders(req *http.Request) {
	req.Header.Set("authority", "searchapi.gw.milanuncios.com")
	req.Header.Set("accept", "application/json, text/plain, */*") // Expect JSON
	req.Header.Set("accept-language", "en-US,en;q=0.9")
	req.Header.Set("cache-control", "no-cache")
	req.Header.Set("dnt", "1")
	req.Header.Set("pragma", "no-cache")
	req.Header.Set("sec-ch-ua", `"Chromium";v="117", "Not;A=Brand";v="8"`)
	req.Header.Set("sec-ch-ua-mobile", "?0")
	req.Header.Set("sec-ch-ua-platform", `"Linux"`)
	req.Header.Set("sec-fetch-dest", "empty")
	req.Header.Set("sec-fetch-mode", "cors")
	req.Header.Set("sec-fetch-site", "same-site")
	req.Header.Set("user-agent", "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36")
	// Omit complex cookie header unless proven necessary and handled dynamically
}

// --- Ensure Client implements Searcher ---
var _ searcher.Searcher = (*Client)(nil)
