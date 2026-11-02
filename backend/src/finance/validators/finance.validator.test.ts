import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  createPayableSchema,
  createSaleSchema,
  idempotencyKeySchema,
  recordPaymentSchema,
} from './finance.validator';

describe('finance request schemas', () => {
  it('requires a customer for credit sales and a payment method for paid sales', () => {
    const items = [{ productId: 1, quantity: 2 }];

    assert.equal(createSaleSchema.safeParse({ paymentType: 'credit', items }).success, false);
    assert.equal(createSaleSchema.safeParse({
      customerName: 'Sam',
      paymentType: 'paid',
      items,
    }).success, false);
    assert.equal(createSaleSchema.safeParse({
      customerName: '  Sam  ',
      paymentType: 'credit',
      items,
    }).success, true);
    assert.equal(createSaleSchema.safeParse({
      customerName: 'Sam',
      paymentType: 'credit',
      paymentMethod: 'cash',
      items,
    }).success, false);
  });

  it('rejects duplicate products and untrusted extra sale fields', () => {
    assert.equal(createSaleSchema.safeParse({
      paymentType: 'paid',
      paymentMethod: 'cash',
      items: [{ productId: 1, quantity: 1 }, { productId: 1, quantity: 2 }],
    }).success, false);
    assert.equal(createSaleSchema.safeParse({
      businessId: 1,
      paymentType: 'paid',
      paymentMethod: 'cash',
      items: [{ productId: 1, quantity: 1 }],
    }).success, false);
  });

  it('validates payable amounts and requires a payment method for partial payment', () => {
    assert.equal(createPayableSchema.safeParse({
      payeeName: 'Parts supplier',
      payeeType: 'supplier',
      description: 'Invoice 12',
      amount: 1500,
      amountPaid: 400,
    }).success, false);
    assert.equal(createPayableSchema.safeParse({
      payeeName: 'Parts supplier',
      payeeType: 'supplier',
      description: 'Invoice 12',
      amount: 1500,
      amountPaid: 400,
      paymentMethod: 'mobile_money',
    }).success, true);
    assert.equal(createPayableSchema.safeParse({
      payeeName: 'Parts supplier',
      payeeType: 'supplier',
      description: 'Invoice 12',
      amount: 1500.29,
    }).success, true);
    assert.equal(createPayableSchema.safeParse({
      payeeName: 'Parts supplier',
      payeeType: 'supplier',
      description: 'Invoice 12',
      amount: 100,
      amountPaid: 101,
    }).success, false);
  });

  it('requires positive recorded payments with a known payment method', () => {
    assert.equal(recordPaymentSchema.safeParse({ amount: 100, paymentMethod: 'cash' }).success, true);
    assert.equal(recordPaymentSchema.safeParse({ amount: 0, paymentMethod: 'cash' }).success, false);
    assert.equal(recordPaymentSchema.safeParse({ amount: 0.001, paymentMethod: 'cash' }).success, false);
    assert.equal(recordPaymentSchema.safeParse({ amount: 10, paymentMethod: 'cheque' }).success, false);
    assert.equal(idempotencyKeySchema.safeParse('not-a-uuid').success, false);
    assert.equal(idempotencyKeySchema.safeParse('f7419c8b-0c3f-4efb-902e-6220a001c1bd').success, true);
  });
});
