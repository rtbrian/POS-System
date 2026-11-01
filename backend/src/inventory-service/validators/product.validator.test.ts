import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  createProductSchema,
  productFiltersSchema,
  productIdSchema,
  updateProductSchema,
} from './product.validator';

describe('product request schemas', () => {
  it('accepts zero stock and nullable optional product fields', () => {
    const product = createProductSchema.parse({
      name: '  Tea  ',
      price: 0,
      stock: 0,
      category: null,
      description: null,
    });

    assert.equal(product.name, 'Tea');
    assert.equal(product.stock, 0);
    assert.equal(product.category, null);
  });

  it('rejects invalid numbers and unknown fields', () => {
    assert.equal(createProductSchema.safeParse({ name: 'Tea', price: -1, stock: 1 }).success, false);
    assert.equal(createProductSchema.safeParse({ name: 'Tea', price: 1, stock: 1.5 }).success, false);
    assert.equal(createProductSchema.safeParse({
      name: 'Tea',
      price: 1,
      stock: 1,
      business_id: 1,
    }).success, false);
  });

  it('allows explicitly clearing nullable fields in partial updates', () => {
    assert.deepEqual(
      updateProductSchema.parse({ category: null, description: null }),
      { category: null, description: null },
    );
    assert.equal(updateProductSchema.safeParse({}).success, false);
  });

  it('defaults pagination, caps page size, and validates product ids', () => {
    assert.deepEqual(productFiltersSchema.parse({}), { page: 1, limit: 50 });
    assert.equal(productFiltersSchema.safeParse({ limit: 101 }).success, false);
    assert.equal(productFiltersSchema.safeParse({ unknown: 'value' }).success, false);
    assert.equal(productIdSchema.safeParse('42').success, true);
    assert.equal(productIdSchema.safeParse('0').success, false);
  });
});
