import { MigrationInterface, QueryRunner, Table, Index } from 'typeorm';

export class CreatePropertyMonthlyPayments1703000000002 implements MigrationInterface {
    name = 'CreatePropertyMonthlyPayments1703000000002'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create the property_monthly_payments table
        await queryRunner.createTable(
            new Table({
                name: 'property_monthly_payments',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        generationStrategy: 'uuid',
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'property_id',
                        type: 'uuid',
                    },
                    {
                        name: 'year',
                        type: 'int',
                    },
                    {
                        name: 'month',
                        type: 'int',
                    },
                    {
                        name: 'amountDue',
                        type: 'decimal',
                        precision: 15,
                        scale: 2,
                        default: 0,
                    },
                    {
                        name: 'amountPaid',
                        type: 'decimal',
                        precision: 15,
                        scale: 2,
                        default: 0,
                    },
                    {
                        name: 'status',
                        type: 'enum',
                        enum: ['pending', 'paid', 'partial', 'overdue'],
                        default: "'pending'",
                    },
                    {
                        name: 'paymentDate',
                        type: 'timestamp',
                        isNullable: true,
                    },
                    {
                        name: 'invoice_id',
                        type: 'uuid',
                        isNullable: true,
                    },
                    {
                        name: 'paid_by',
                        type: 'uuid',
                        isNullable: true,
                    },
                    {
                        name: 'notes',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'isActive',
                        type: 'boolean',
                        default: true,
                    },
                    {
                        name: 'createdAt',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                    },
                    {
                        name: 'updatedAt',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                        onUpdate: 'CURRENT_TIMESTAMP',
                    },
                ],
                foreignKeys: [
                    {
                        columnNames: ['property_id'],
                        referencedTableName: 'property',
                        referencedColumnNames: ['id'],
                        onDelete: 'CASCADE',
                    },
                    {
                        columnNames: ['invoice_id'],
                        referencedTableName: 'invoices',
                        referencedColumnNames: ['id'],
                        onDelete: 'SET NULL',
                    },
                    {
                        columnNames: ['paid_by'],
                        referencedTableName: 'user',
                        referencedColumnNames: ['id'],
                        onDelete: 'SET NULL',
                    },
                ],
                indices: [
                    {
                        name: 'IDX_PROPERTY_MONTHLY_PAYMENT_PROPERTY',
                        columnNames: ['property_id'],
                    },
                    {
                        name: 'IDX_PROPERTY_MONTHLY_PAYMENT_YEAR_MONTH',
                        columnNames: ['year', 'month'],
                    },
                    {
                        name: 'IDX_PROPERTY_MONTHLY_PAYMENT_STATUS',
                        columnNames: ['status'],
                    },
                    {
                        name: 'IDX_PROPERTY_MONTHLY_PAYMENT_UNIQUE',
                        columnNames: ['property_id', 'year', 'month'],
                        isUnique: true,
                    },
                ],
            }),
            true,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop the table (indexes and foreign keys will be dropped automatically)
        await queryRunner.dropTable('property_monthly_payments');
    }
}