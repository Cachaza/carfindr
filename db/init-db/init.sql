-- Create the brand table
CREATE TABLE marcas (
    -- label,cochesNetId,milanunciosId,wallapopId,cochesComId
    label VARCHAR(255) NOT NULL,
    cochesNetId INTEGER PRIMARY KEY,
    milanunciosId VARCHAR(255),
    wallapopId VARCHAR(255),
    cochesComId VARCHAR(255)
);

-- Create the model table with a foreign key to brand
CREATE TABLE modelos (
    -- cochesNetMarcaId,cochesNetModeloId,milanunciosMarcaId,milanunciosModeloId,wallapopMarcaId,wallapopModeloId,cochesComMarcaId,cochesComModeloId
    cochesNetMarcaId INTEGER NOT NULL,
    cochesNetModeloId INTEGER PRIMARY KEY,
    milanunciosMarcaId VARCHAR(255),
    milanunciosModeloId VARCHAR(255),
    wallapopMarcaId VARCHAR(255),
    wallapopModeloId VARCHAR(255),
    cochesComMarcaId VARCHAR(255),
    cochesComModeloId VARCHAR(255),

    FOREIGN KEY (cochesNetMarcaId) REFERENCES marcas(cochesNetId)
);


-- Load data into the brand table
COPY marcas(label, cochesNetId, milanunciosId, wallapopId, cochesComId)
FROM '/csv-data/dictionaryCochesNetMilanunciosMarcas.csv'
DELIMITER ','
CSV HEADER
NULL '';

-- Load data into the model table
COPY modelos(cochesNetMarcaId,cochesNetModeloId,milanunciosMarcaId,milanunciosModeloId,wallapopMarcaId,wallapopModeloId,cochesComMarcaId,cochesComModeloId)
FROM '/csv-data/updated_dictionary.csv'
DELIMITER ',' 
CSV HEADER
NULL '';

-- Create an index for better query performance
CREATE INDEX idx_modelos_cochesNetModeloId ON modelos(cochesNetModeloId);