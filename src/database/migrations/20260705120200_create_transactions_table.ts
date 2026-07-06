import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('transactions', (table) => {
    table.uuid('id').primary();
    table
      .uuid('wallet_id')
      .notNullable()
      .references('id')
      .inTable('wallets')
      .onUpdate('RESTRICT')
      .onDelete('RESTRICT');
    table.enum('type', ['funding', 'withdrawal', 'transfer']).notNullable();
    table.enum('direction', ['credit', 'debit']).notNullable();
    table.bigInteger('amount').unsigned().notNullable();
    table.bigInteger('balance_before').unsigned().notNullable();
    table.bigInteger('balance_after').unsigned().notNullable();
    table
      .uuid('counterparty_wallet_id')
      .nullable()
      .references('id')
      .inTable('wallets')
      .onUpdate('RESTRICT')
      .onDelete('RESTRICT');
    table.string('reference', 64).notNullable();
    table.json('metadata').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    table.index('wallet_id');
    table.index('reference');
    table.index('created_at');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('transactions');
}
