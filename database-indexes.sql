-- Database Performance Optimization Indexes
-- Run these commands to improve query performance

-- Property-related indexes
CREATE INDEX IF NOT EXISTS idx_property_status ON property(status);
CREATE INDEX IF NOT EXISTS idx_property_is_main ON property(is_main);
CREATE INDEX IF NOT EXISTS idx_property_users_property_id ON property_users(property_id);
CREATE INDEX IF NOT EXISTS idx_property_users_user_id ON property_users(user_id);

-- User-related indexes
CREATE INDEX IF NOT EXISTS idx_user_status ON "user"(status);
CREATE INDEX IF NOT EXISTS idx_user_roles ON "user" USING GIN(roles);

-- Visitor-related indexes
CREATE INDEX IF NOT EXISTS idx_visitor_property_id ON visitor(property_id);
CREATE INDEX IF NOT EXISTS idx_visitor_status ON visitor(status);
CREATE INDEX IF NOT EXISTS idx_visitor_date ON visitor(date);
CREATE INDEX IF NOT EXISTS idx_visitor_visit_completed ON visitor(visit_completed);

-- Package-related indexes
CREATE INDEX IF NOT EXISTS idx_package_property_id ON package(property_id);
CREATE INDEX IF NOT EXISTS idx_package_user_id ON package(user_id);
CREATE INDEX IF NOT EXISTS idx_package_received ON package(received);

-- Emergency-related indexes
CREATE INDEX IF NOT EXISTS idx_emergency_user_id ON emergency(user_id);
CREATE INDEX IF NOT EXISTS idx_emergency_status ON emergency(status);
CREATE INDEX IF NOT EXISTS idx_emergency_seen ON emergency(seen);

-- Invoice-related indexes
CREATE INDEX IF NOT EXISTS idx_invoice_user_id ON invoice(user_id);
CREATE INDEX IF NOT EXISTS idx_invoice_confirmed ON invoice(confirmed);

-- Notification-related indexes
CREATE INDEX IF NOT EXISTS idx_notification_user_id ON notification(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_seen ON notification(seen);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_property_status_main ON property(status, is_main);
CREATE INDEX IF NOT EXISTS idx_visitor_property_status ON visitor(property_id, status);
CREATE INDEX IF NOT EXISTS idx_package_user_received ON package(user_id, received);