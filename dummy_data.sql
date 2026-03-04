-- ==========================================
-- 1. DUMMY USERS
-- Password for all users: password123
-- ==========================================

INSERT INTO users (id, username, name, vocation, email, role, hash, status) 
VALUES 
(1, 'admin_derven', 'Derven Admin', 'Software Engineer', 'admin@rotary.org', 'Admin', '$argon2id$v=19$m=65536,t=3,p=4$L4KeUAoBVqRHxhGPYzlLDw$jNsqYFxaMQVIffaDP1XuzARzXbOAnRjKUMkMPTyd1Qk', 'Active'),
(2, 'member_alice', 'Alice Johnson', 'Teacher', 'alice@rotary.org', 'Member', '$argon2id$v=19$m=65536,t=3,p=4$L4KeUAoBVqRHxhGPYzlLDw$jNsqYFxaMQVIffaDP1XuzARzXbOAnRjKUMkMPTyd1Qk', 'Active'),
(3, 'member_bob', 'Bob Smith', 'Accountant', 'bob@rotary.org', 'Member', '$argon2id$v=19$m=65536,t=3,p=4$L4KeUAoBVqRHxhGPYzlLDw$jNsqYFxaMQVIffaDP1XuzARzXbOAnRjKUMkMPTyd1Qk', 'Inactive');

-- ==========================================
-- 2. DUMMY PROJECTS
-- ==========================================

INSERT INTO projects (id, title, description, location, start_date, end_date, status, budget, admin_id) 
VALUES 
(1, 'Makati Clean Water Initiative', 'Installing community water filters.', 'Makati City', '2026-04-01 08:00:00', '2026-06-01 17:00:00', 'Planned', 50000.00, 1),
(2, 'School Supplies Drive', 'Donating textbooks and bags to local schools.', 'Manila', '2026-01-10 09:00:00', '2026-02-15 15:00:00', 'Completed', 15000.00, 1),
(3, 'Tree Planting 2026', 'Annual tree planting to promote green spaces.', 'Quezon City', '2026-05-20 07:00:00', '2026-05-20 12:00:00', 'Ongoing', 5000.00, 1);

-- ==========================================
-- 3. DUMMY FINANCIAL RECORDS (Project Expenses)
-- ==========================================

-- Expenses for the completed "School Supplies Drive" (Project ID 2)
INSERT INTO project_expenses (id, project_id, price, description, category, quantity, location, date_purchased) 
VALUES 
(1, 2, 500.00, 'Mathematics Textbooks', 'Supplies', 20, 'National Bookstore', '2026-01-12 10:30:00'),
(2, 2, 250.00, 'Backpacks', 'Supplies', 15, 'SM Department Store', '2026-01-14 14:00:00'),
(3, 2, 1000.00, 'Van Rental for Delivery', 'Logistics', 1, 'Metro Rentals', '2026-02-10 08:00:00');

-- Expenses for the "Tree Planting" (Project ID 3)
INSERT INTO project_expenses (id, project_id, price, description, category, quantity, location, date_purchased) 
VALUES 
(4, 3, 50.00, 'Mahogany Seedlings', 'Materials', 50, 'City Nursery', '2026-03-01 09:15:00');

-- ==========================================
-- 4. DUMMY EVENTS
-- ==========================================

INSERT INTO events (id, title, description, date, event_type, admin_id) 
VALUES 
(1, 'March General Assembly', 'Monthly meeting to discuss upcoming community projects.', '2026-03-15 18:00:00', 'Meeting', 1),
(2, 'New Member Welcoming', 'Welcoming Alice and others to the club.', '2026-03-22 19:00:00', 'Induction Ceremony', 1),
(3, 'Water Filter Setup Day', 'Volunteers needed to help install filters in Makati.', '2026-04-05 08:00:00', 'Project Schedule', 1);
