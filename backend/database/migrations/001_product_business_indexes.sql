DO $$
BEGIN
  IF to_regclass('public.products') IS NOT NULL
     AND EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'business_id'
     )
     AND EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'id'
     ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_products_business_id_id ON public.products (business_id, id)';
  END IF;

  IF to_regclass('public.products') IS NOT NULL
     AND EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'business_id'
     )
     AND EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'category'
     ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_products_business_id_category ON public.products (business_id, category)';
  END IF;
END $$;
