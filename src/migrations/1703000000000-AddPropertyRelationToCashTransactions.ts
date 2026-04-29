import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class AddPropertyRelationToCashTransactions1703000000000 implements MigrationInterface {
    name = 'AddPropertyRelationToCashTransactions1703000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create the junction table for the many-to-many relationship
        await queryRunner.createTable(
            new Table({
                name: 'daily_cash_transaction_properties',
                columns: [
                    {
                        name: 'transaction_id',
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
                        columnNames: ['transaction_id'],
                        referencedTableName: 'daily_cash_transactions',
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
                        name: 'IDX_TRANSACTION_PROPERTY_TRANSACTION',
                        columnNames: ['transaction_id'],
                    },
                    {
                        name: 'IDX_TRANSACTION_PROPERTY_PROPERTY',
                        columnNames: ['property_id'],
                    },
                ],
            }),
            true,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop the junction table (indexes will be dropped automatically)
        await queryRunner.dropTable('daily_cash_transaction_properties');
    }
}