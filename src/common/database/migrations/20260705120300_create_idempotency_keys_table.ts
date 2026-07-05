import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('idempotency_keys', (table) => {
    table.uuid('id').primary();
    table.string('idempotency_key', 255).notNullable().unique();
    table
      .uuid('user_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onUpdate('RESTRICT')
      .onDelete('RESTRICT');
    table.string('resource_reference', 64).notNullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    table.index('user_id');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('idempotency_keys');
}
