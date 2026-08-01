# AccountPilot AI — RAG Pipeline Documentation

## 1. Overview & Architecture

AccountPilot AI relies on a high-precision **Retrieval-Augmented Generation (RAG)** pipeline to ground agent reasoning and outreach content in verified enterprise facts. The RAG architecture utilizes **Supabase PostgreSQL** with `pgvector` for vector storage and hybrid semantic search.

---

## 2. Ingestion & Preprocessing Workflow

```text
[Document Upload (PDF/Docx/MD)]
               ↓
    Document Parsing (Docling)
               ↓
  Semantic Text Chunking
  - Strategy: Recursive Character Splitting
  - Chunk Size: 800 Tokens (~3200 characters)
  - Overlap: 100 Tokens
               ↓
  Metadata Enrichment
  (workspace_id, product_id, doc_name, page_num, section_header)
               ↓
  Embedding Generation
  - Model: OpenAI text-embedding-3-large
  - Dimensions: 3072
               ↓
  Database Insertion
  - Table: document_chunks
  - Index: HNSW (Hierarchical Navigable Small World)
```

---

## 3. Hybrid Search & Retrieval Strategy

To maximize retrieval precision, AccountPilot AI employs **Hybrid Search** combining dense vector similarity with sparse keyword matching (BM25 / Full-Text Search in Postgres).

### SQL Retrieval Function (`hybrid_match_chunks`)

```sql
CREATE OR REPLACE FUNCTION hybrid_match_chunks(
  query_text TEXT,
  query_embedding VECTOR(3072),
  match_count INT,
  filter_workspace_id UUID,
  filter_product_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  document_id UUID,
  content TEXT,
  similarity FLOAT,
  metadata JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id,
    dc.document_id,
    dc.content,
    1 - (dc.embedding <=> query_embedding) AS similarity,
    dc.metadata
  FROM document_chunks dc
  WHERE dc.workspace_id = filter_workspace_id
    AND (filter_product_id IS NULL OR dc.product_id = filter_product_id)
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

---

## 4. Context Window Management & Reranking

1. **Initial Candidate Retrieval**: Fetch top 25 chunks using vector cosine distance.
2. **Cross-Encoder Reranking**: Re-score the 25 candidate chunks against the target query using a fast local cross-encoder model to select the top 5 most relevant chunks.
3. **Prompt Injection**: Construct structured context block with chunk IDs:

```text
--- RETRIEVED CONTEXT START ---
[Doc-102:Chunk-1] (Page 2, Section: Executive Overview)
Acme Corp announces expansion into European market with new Frankfurt datacenters.

[Doc-882:Chunk-2] (Page 5, Section: Customer Case Study)
We helped Global FinTech Corp automate evidence collection, reducing audit cycles by 60%.
--- RETRIEVED CONTEXT END ---
```

---

## 5. Performance Optimizations

- **HNSW Vector Indexing**: Configured with `m = 16` and `ef_construction = 64` for sub-10ms retrieval latency across 1,000,000+ vector chunks.
- **Asynchronous Ingestion**: PDF parsing and embedding generation take place out-of-band in Celery background workers.
