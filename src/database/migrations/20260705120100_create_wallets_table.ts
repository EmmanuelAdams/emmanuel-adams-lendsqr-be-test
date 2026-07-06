import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('wallets', (table) => {
    table.uuid('id').primary();
    table
      .uuid('user_id')
      .notNullable()
      .unique()
      .references('id')
      .inTable('users')
      .onUpdate('RESTRICT')
      .onDelete('RESTRICT');
    table.string('account_number', 10).notNullable().unique();
    table.bigInteger('balance').unsigned().notNullable().defaultTo(0);
    table.string('currency', 3).notNullable().defaultTo('NGN');
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('wallets');
}
