import { Request, Response } from 'express';
import supabase from '../config/db';

type ElementsRow = { elements: Record<string, unknown> | null } | null;
type SupabaseError = { message: string } | null;

/**
 * Universal annotation save pipeline.
 *
 * Accepts any feature's data slice and merges it into the JSONB `elements`
 * column for the given page URL. This means saving sticky notes will never
 * overwrite drawings, and vice versa.
 *
 * Expected request body:
 *   pageUrl    — the normalized URL of the page (e.g. "https://example.com/article")
 *   featureKey — which feature is saving ("stickyNotes" | "drawings" | "rewrites" | "summaries")
 *   data       — the full state array/object for that feature
 */
export async function saveAnnotations(req: Request, res: Response): Promise<void> {
  const { pageUrl, featureKey, data } = req.body;

  if (!pageUrl || !featureKey || data === undefined) {
    res.status(400).json({ error: 'pageUrl, featureKey, and data are required' });
    return;
  }

  // 1. Fetch whatever is already saved for this URL so we can merge slices
  const fetchResult = await (supabase
    .from('annotations')
    .select('elements')
    .eq('page_url', pageUrl)
    .maybeSingle() as unknown as Promise<{ data: ElementsRow; error: SupabaseError }>);

  if (fetchResult.error) {
    res.status(500).json({ error: fetchResult.error.message });
    return;
  }

  // 2. Merge the incoming feature slice into the existing elements blob
  //    e.g. { stickyNotes: [...] } gets merged with { drawings: [...] }
  const existingElements = fetchResult.data?.elements ?? {};
  const mergedElements = { ...existingElements, [featureKey]: data };

  // 3. Upsert — inserts if page_url is new, updates if it already exists
  //    Requires a UNIQUE constraint on page_url in Supabase
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const annotationsTable = supabase.from('annotations') as any;
  const upsertResult = await annotationsTable.upsert(
    {
      page_url: pageUrl,
      elements: mergedElements,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'page_url' }
  ) as { error: SupabaseError };

  if (upsertResult.error) {
    res.status(500).json({ error: upsertResult.error.message });
    return;
  }

  res.status(200).json({ success: true });
}

/**
 * Retrieve all saved annotations for a given page URL.
 * Returns the full elements blob keyed by feature.
 *
 * Query param: pageUrl
 */
export async function loadAnnotations(req: Request, res: Response): Promise<void> {
  const pageUrl = req.query.pageUrl as string;

  if (!pageUrl) {
    res.status(400).json({ error: 'pageUrl query param is required' });
    return;
  }

  const fetchResult = await (supabase
    .from('annotations')
    .select('elements')
    .eq('page_url', pageUrl)
    .maybeSingle() as unknown as Promise<{ data: ElementsRow; error: SupabaseError }>);

  if (fetchResult.error) {
    res.status(500).json({ error: fetchResult.error.message });
    return;
  }

  res.status(200).json({ elements: fetchResult.data?.elements ?? {} });
}
