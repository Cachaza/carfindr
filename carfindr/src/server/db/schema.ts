import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTableCreator,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => name);

export const users = createTable("user", {
  id: varchar("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: varchar("image", { length: 255 }),
  createdAt: timestamp("created_at", {
    mode: "date",
    withTimezone: true,
  })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at", {
    mode: "date",
    withTimezone: true,
  })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const accounts = createTable(
  "account",
  {
    id: varchar("id", { length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: varchar("user_id", { length: 255 })
      .notNull()
      .references(() => users.id),
    accountId: varchar("account_id", { length: 255 }).notNull(),
    providerId: varchar("provider_id", { length: 255 }).notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", {
      mode: "date",
      withTimezone: true,
    }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
      mode: "date",
      withTimezone: true,
    }),
    scope: varchar("scope", { length: 255 }),
    idToken: text("id_token"),
    password: text("password"),
    createdAt: timestamp("created_at", {
      mode: "date",
      withTimezone: true,
    })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp("updated_at", {
      mode: "date",
      withTimezone: true,
    })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (account) => ({
    providerAccountUnique: uniqueIndex("account_provider_account_unique").on(
      account.providerId,
      account.accountId
    ),
    userIdIdx: index("account_user_id_idx").on(account.userId),
  })
);

export const sessions = createTable(
  "session",
  {
    id: varchar("id", { length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: varchar("user_id", { length: 255 })
      .notNull()
      .references(() => users.id),
    token: varchar("token", { length: 255 }).notNull().unique(),
    expiresAt: timestamp("expires_at", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
    ipAddress: varchar("ip_address", { length: 255 }),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", {
      mode: "date",
      withTimezone: true,
    })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp("updated_at", {
      mode: "date",
      withTimezone: true,
    })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (session) => ({
    userIdIdx: index("session_user_id_idx").on(session.userId),
  })
);

export const verifications = createTable(
  "verification",
  {
    id: varchar("id", { length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    identifier: varchar("identifier", { length: 255 }).notNull(),
    value: varchar("value", { length: 255 }).notNull(),
    expiresAt: timestamp("expires_at", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
    createdAt: timestamp("created_at", {
      mode: "date",
      withTimezone: true,
    })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp("updated_at", {
      mode: "date",
      withTimezone: true,
    })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  }
);

export const marcas = createTable(
  "marcas",
  {
    label: varchar("label", { length: 255 }).notNull(),
    cochesNetId: integer("cochesnetid").primaryKey(),
    milanunciosId: varchar("milanunciosid", { length: 255 }),
    wallapopId: varchar("wallapopid", { length: 255 }),
    cochesComId: varchar("cochescomid", { length: 255 })
  }
);

export const modelos = createTable(
  "modelos",
  {
    cochesNetMarcaId: integer('cochesnetmarcaid')
    .notNull()
    .references(() => marcas.cochesNetId),
  cochesNetModeloId: integer('cochesnetmodeloid').primaryKey(),
  milanunciosMarcaId: varchar('milanunciosmarcaid', { length: 255 }),
  milanunciosModeloId: varchar('milanunciosmodeloid', { length: 255 }),
  wallapopMarcaId: varchar('wallapopmarcaid', { length: 255 }),
  wallapopModeloId: varchar('wallapopmodeloid', { length: 255 }),
  cochesComMarcaId: varchar('cochescommarcaid', { length: 255 }),
  cochesComModeloId: varchar('cochescommodeloid', { length: 255 }),
  }
);

// Corrected and unique declaration of savedSearches
export const savedSearches = createTable(
  "saved_search",
  {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    userId: varchar("user_id", { length: 255 })
      .notNull()
      .references(() => users.id),
    name: varchar("name", { length: 255 }), // Optional: for users to name their searches
    brandId: varchar("brand_id", { length: 255 }),
    modelId: varchar("model_id", { length: 255 }),
    yearFrom: integer("year_from"),
    yearTo: integer("year_to"),
    priceFrom: integer("price_from"),
    priceTo: integer("price_to"),
    kmFrom: integer("km_from"),
    kmTo: integer("km_to"),
    transmission: varchar("transmission", { length: 50 }),
    searchText: text("search_text"),
    brandParam: varchar("brand_param", { length: 255 }), // Corresponds to selectedBrandParam
    modelParam: varchar("model_param", { length: 255 }), // Corresponds to selectedModelParam
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    lastRun: timestamp("last_run", { withTimezone: true }), // New: for scheduler
    nextPageData: jsonb("next_page_data"), // New: to store pagination tokens
  },
  (search) => ({
    userIdIdx: index("saved_search_user_id_idx").on(search.userId),
    nameIdx: index("saved_search_name_idx").on(search.name),
  })
);

export const searchedCarListings = createTable(
  "searched_car_listings",
  {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    savedSearchId: integer("saved_search_id")
      .notNull()
      .references(() => savedSearches.id),
    listingHash: varchar("listing_hash", { length: 255 }).notNull(),
    listingId: varchar("listing_id", { length: 255 }), // Optional: the unique ID of the listing on the source platform
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => ({
    savedSearchIdIdx: index("searched_car_listings_saved_search_id_idx").on(table.savedSearchId),
    uniqueListingHash: uniqueIndex("searched_car_listings_unique_hash").on(table.savedSearchId, table.listingHash),
  })
);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  savedSearches: many(savedSearches),
}));

export const savedSearchesRelations = relations(savedSearches, ({ one, many }) => ({
  user: one(users, {
    fields: [savedSearches.userId],
    references: [users.id],
  }),
  searchedCarListings: many(searchedCarListings),
}));

// Add the missing relation for searchedCarListings
export const searchedCarListingsRelations = relations(searchedCarListings, ({ one }) => ({
  savedSearch: one(savedSearches, {
    fields: [searchedCarListings.savedSearchId],
    references: [savedSearches.id],
  }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const marcasRelations = relations(marcas, ({ many }) => ({
  modelos: many(modelos),
}));

export const modelosRelations = relations(modelos, ({ one }) => ({
  marca: one(marcas, {
    fields: [modelos.cochesNetMarcaId],
    references: [marcas.cochesNetId],
  }),
}));
