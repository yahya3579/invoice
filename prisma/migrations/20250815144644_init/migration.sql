-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(255) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `original_password` VARCHAR(255) NULL,
    `name` VARCHAR(255) NOT NULL,
    `role` ENUM('admin', 'user') NOT NULL DEFAULT 'user',
    `organizationId` INTEGER NULL,
    `fbrApiToken` TEXT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `subscription_status` ENUM('active', 'inactive', 'expired') NOT NULL DEFAULT 'inactive',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `organizations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `ntn` VARCHAR(50) NOT NULL,
    `address` TEXT NOT NULL,
    `province` VARCHAR(100) NULL,
    `phone` VARCHAR(20) NULL,
    `email` VARCHAR(255) NULL,
    `business_type` ENUM('product', 'service') NOT NULL,
    `subscription_plan` VARCHAR(100) NULL,
    `subscription_expires_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `organizations_ntn_key`(`ntn`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `invoices` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `organization_id` INTEGER NOT NULL,
    `invoice_number` VARCHAR(100) NULL,
    `irn` VARCHAR(255) NULL,
    `buyer_name` VARCHAR(255) NOT NULL,
    `buyer_ntn` VARCHAR(50) NULL,
    `buyer_address` TEXT NULL,
    `buyer_ntn_cnic` VARCHAR(100) NULL,
    `buyer_business_name` VARCHAR(255) NULL,
    `buyer_province` VARCHAR(100) NULL,
    `buyer_registration_type` VARCHAR(100) NULL,
    `invoice_ref_no` VARCHAR(255) NULL,
    `scenario_id` VARCHAR(50) NULL,
    `invoice_type` VARCHAR(100) NULL,
    `sro_schedule_no` VARCHAR(50) NULL,
    `sales_tax_withheld_at_source` DECIMAL(15, 2) NULL,
    `further_tax` DECIMAL(15, 2) NULL,
    `fixed_notified_value_or_retail_price` DECIMAL(15, 2) NULL,
    `invoice_date` DATETIME(3) NOT NULL,
    `due_date` DATETIME(3) NULL,
    `subtotal` DECIMAL(15, 2) NOT NULL,
    `tax_amount` DECIMAL(15, 2) NOT NULL,
    `total_amount` DECIMAL(15, 2) NOT NULL,
    `currency` VARCHAR(3) NOT NULL DEFAULT 'PKR',
    `status` ENUM('draft', 'registered', 'failed') NOT NULL DEFAULT 'draft',
    `fbr_response` JSON NULL,
    `fbr_error_code` VARCHAR(50) NULL,
    `fbr_error_message` TEXT NULL,
    `pdf_path` VARCHAR(500) NULL,
    `qr_code` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `invoices_irn_key`(`irn`),
    INDEX `idx_invoice_date`(`invoice_date`),
    INDEX `idx_buyer_ntn`(`buyer_ntn`),
    INDEX `idx_irn`(`irn`),
    INDEX `idx_fbr_error_code`(`fbr_error_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `invoice_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `invoice_id` INTEGER NOT NULL,
    `item_description` TEXT NOT NULL,
    `hs_code` VARCHAR(20) NULL,
    `product_description` TEXT NULL,
    `rate` DECIMAL(15, 2) NULL,
    `uom` VARCHAR(100) NULL,
    `quantity` DECIMAL(10, 2) NOT NULL DEFAULT 1,
    `unit_price` DECIMAL(15, 2) NOT NULL,
    `value_sales_excluding_st` DECIMAL(15, 2) NULL,
    `total_values` DECIMAL(15, 2) NULL,
    `fixed_notified_value_or_retail_price` DECIMAL(15, 2) NULL,
    `sales_tax_applicable` DECIMAL(5, 2) NULL,
    `sales_tax_withheld_at_source` DECIMAL(15, 2) NULL,
    `extra_tax` VARCHAR(50) NULL,
    `further_tax` DECIMAL(15, 2) NULL,
    `sro_schedule_no` VARCHAR(50) NULL,
    `fed_payable` DECIMAL(15, 2) NULL,
    `discount` DECIMAL(15, 2) NULL,
    `sale_type` VARCHAR(255) NULL,
    `sro_item_serial_no` VARCHAR(50) NULL,
    `tax_rate` DECIMAL(5, 2) NOT NULL,
    `tax_amount` DECIMAL(15, 2) NOT NULL,
    `total_amount` DECIMAL(15, 2) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `error_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NULL,
    `error_code` VARCHAR(50) NULL,
    `error_message` TEXT NULL,
    `error_context` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fbr_error_codes` (
    `code` VARCHAR(50) NOT NULL,
    `message` TEXT NOT NULL,
    `brief_description` TEXT NOT NULL,
    `category` VARCHAR(50) NOT NULL DEFAULT 'sales',
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_profiles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `invoice_type` VARCHAR(100) NULL,
    `invoice_date` DATETIME(3) NULL,
    `seller_ntn_cnic` VARCHAR(100) NULL,
    `seller_business_name` VARCHAR(255) NULL,
    `seller_province` VARCHAR(100) NULL,
    `seller_address` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `user_profiles_user_id_key`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_fbr_error_code_fkey` FOREIGN KEY (`fbr_error_code`) REFERENCES `fbr_error_codes`(`code`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoice_items` ADD CONSTRAINT `invoice_items_invoice_id_fkey` FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `error_logs` ADD CONSTRAINT `error_logs_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_profiles` ADD CONSTRAINT `user_profiles_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
