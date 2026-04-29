import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class AddSelectedPropertiesToInvoice1703000000001 implements MigrationInterface {
    name = 'AddSelectedPropertiesToInvoice1703000000001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create the junction table for the many-to-many relationship between invoices and selected properties
        await queryRunner.createTable(
            new Table({
                name: 'invoice_selected_properties',
                columns: [
                    {
                        name: 'invoice_id',
                        type: 'uuid',
                        isPrimary: true,
                    },
                    {
                        name: 'property_id',
                        type: 'uuid',
                        isPrimary: true,
                    },
                ],
                foreignKeys: [
                    {
                        columnNames: ['invoice_id'],
                        referencedTableName: 'invoices',
                        referencedColumnNames: ['id'],
                        onDelete: 'CASCADE',
                    },
                    {
                        columnNames: ['property_id'],
                        referencedTableName: 'property',
                        referencedColumnNames: ['id'],
                        onDelete: 'CASCADE',
                    },
                ],
                indices: [
                    {
                        name: 'IDX_INVOICE_SELECTED_PROPERTIES_INVOICE',
                        columnNames: ['invoice_id'],
                    },
                    {
                        name: 'IDX_INVOICE_SELECTED_PROPERTIES_PROPERTY',
                        columnNames: ['property_id'],
                    },
                ],
            }),
            true,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop the junction table (indexes will be dropped automatically)
        await queryRunner.dropTable('invoice_selected_properties');
    }
}