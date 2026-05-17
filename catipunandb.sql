CREATE TABLE USER (
    user_id       INT          PRIMARY KEY NOT NULL AUTO_INCREMENT,
    full_name     VARCHAR(100) NOT NULL,
    email         VARCHAR(150) NOT NULL UNIQUE,
    role          ENUM('admin','cashier','staff') NOT NULL DEFAULT 'staff',
    username      VARCHAR(50)  NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE CATEGORY (
    category_id INT          PRIMARY KEY NOT NULL AUTO_INCREMENT,
    name        VARCHAR(100) NOT NULL,
    description TEXT
);

CREATE TABLE PRODUCT (
    product_id   INT           PRIMARY KEY NOT NULL AUTO_INCREMENT,
    name         VARCHAR(150)  NOT NULL,
    description  TEXT,
    price        DECIMAL(10,2) NOT NULL,
    image_url    VARCHAR(255),
    is_available TINYINT(1)    NOT NULL DEFAULT 1,
    category_id  INT           NOT NULL,
    FOREIGN KEY (category_id) REFERENCES CATEGORY (category_id)
);

CREATE TABLE INVENTORY (
    inventory_id        INT       PRIMARY KEY NOT NULL AUTO_INCREMENT,
    quantity            INT       NOT NULL DEFAULT 0,
    low_stock_threshold INT       NOT NULL DEFAULT 10,
    last_updated        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    product_id          INT       NOT NULL UNIQUE,
    FOREIGN KEY (product_id) REFERENCES PRODUCT (product_id)
);


CREATE TABLE CATROOMBOOKING (
    booking_id  INT           PRIMARY KEY NOT NULL AUTO_INCREMENT,
    check_in    DATETIME      NOT NULL,
    check_out   DATETIME      NOT NULL,
    party_size  INT           NOT NULL DEFAULT 1,
    booking_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    status      ENUM('confirmed','active','completed') NOT NULL DEFAULT 'confirmed',
    user_id     INT           NOT NULL,
    FOREIGN KEY (user_id) REFERENCES USER (user_id),
    CHECK (check_out > check_in)
);

CREATE TABLE `ORDER` (
    order_id     INT           PRIMARY KEY NOT NULL AUTO_INCREMENT,
    order_type   ENUM('walk_in','cat_room') NOT NULL DEFAULT 'walk_in',
    status       ENUM('preparing','completed') NOT NULL DEFAULT 'preparing',
    subtotal     DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    created_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_id      INT           NOT NULL,
    booking_id   INT,
    FOREIGN KEY (user_id)    REFERENCES USER (user_id),
    FOREIGN KEY (booking_id) REFERENCES CATROOMBOOKING (booking_id)
);

CREATE TABLE ORDERITEM (
    item_id    INT           PRIMARY KEY NOT NULL AUTO_INCREMENT,
    quantity   INT           NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    order_id   INT           NOT NULL,
    product_id INT           NOT NULL,
    FOREIGN KEY (order_id)   REFERENCES `ORDER` (order_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES PRODUCT (product_id)
);

CREATE TABLE INVENTORYLOG (
    log_id          INT       PRIMARY KEY NOT NULL AUTO_INCREMENT,
    action          ENUM('restock','consumed') NOT NULL,
    quantity_change INT       NOT NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    inventory_id    INT       NOT NULL,
    user_id         INT       NOT NULL,
    FOREIGN KEY (inventory_id) REFERENCES INVENTORY (inventory_id),
    FOREIGN KEY (user_id)      REFERENCES USER (user_id)
);

CREATE TABLE PAYMENT (
    payment_id   INT           PRIMARY KEY NOT NULL AUTO_INCREMENT,
    method       ENUM('cash','gcash') NOT NULL DEFAULT 'cash',
    booking_fee  DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    order_total  DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    grand_total  DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    status       ENUM('pending','completed') NOT NULL DEFAULT 'pending',
    reference_no VARCHAR(100),
    paid_at      TIMESTAMP,
    user_id      INT           NOT NULL,
    order_id     INT,
    booking_id   INT,
    FOREIGN KEY (user_id)    REFERENCES USER (user_id),
    FOREIGN KEY (order_id)   REFERENCES `ORDER` (order_id),
    FOREIGN KEY (booking_id) REFERENCES CATROOMBOOKING (booking_id)
);

INSERT INTO USER (full_name, email, role, username, password_hash, created_at) VALUES
  ('Admin User',      'admin@catipunan.com',  'admin',   'admin',   '$2a$12$loNOu8vn5zg.yG26g4h10.c9lROzD1ppXpZvsGa8RicYhjtgUvTE.', NOW()),
  ('Juan Cruz',       'juan@catipunan.com',   'cashier', 'juanc',   '$2a$12$2Nf5UVstHgcQRPuhgNfF6eYhK3.4XbwMFvTC3Ed8wvFND0M5vR8aS',  NOW()),
  ('Maria Reyes',     'maria@catipunan.com',  'staff',   'mariar',  '$2a$12$LhEsW.BWgq4jx8SFPX7d1eiOQ6vKnP8X4showC/25YD/vItvPcZ.6',  NOW()),
  ('Carlos Santos',   'carlos@catipunan.com', 'cashier', 'carlosg', '$2a$12$3Kg7XVwtJhcRQSviOHgG7eZiL5.5YcxNGwUD4Fe9xwGOE1N6wS9bT',  NOW()),
  ('Ana Villanueva',  'ana@catipunan.com',    'staff',   'anav',    '$2a$12$4Mh8YWxuKidSRTwjPIhH8fAjM6.6ZdyOHxVE5Gf0yxHPF2O7xT0cU',  NOW());

  INSERT INTO CATEGORY (name, description) VALUES
  ('Cold Coffee', 'Cold espresso-based drinks'),
  ('Hot Coffee',  'Hot espresso-based drinks'),
  ('Tea',         'Hot and iced tea beverages'),
  ('Snack',       'Light bites and pastries'),
  ('Fruit Soda',  'Sparkling fruit-infused sodas');
 
 INSERT INTO PRODUCT (name, description, price, is_available, category_id) VALUES
  -- Cold Coffee
  ('Iced Americano',   'Espresso over ice with cold water',          85.00, 1, 1),
  ('Iced Latte',       'Espresso with cold milk over ice',          100.00, 1, 1),
  -- Hot Coffee
  ('Espresso',         'Classic single shot',                        65.00, 1, 2),
  ('Cappuccino',       'Espresso with steamed and frothed milk',     95.00, 1, 2),
  -- Tea
  ('Matcha Latte',     'Japanese matcha with steamed milk',         110.00, 1, 3),
  ('Iced Chamomile',   'Soothing chamomile tea served over ice',     85.00, 1, 3),
  -- Snack
  ('Butter Croissant', 'Flaky, buttery classic pastry',              75.00, 1, 4),
  ('Cheese Sandwich',  'Toasted sandwich with melted cheese',        90.00, 1, 4),
  -- Fruit Soda
  ('Lemon Fizz',       'Sparkling lemon juice with soda water',      80.00, 1, 5),
  ('Strawberry Soda',  'Fresh strawberry syrup with sparkling water',90.00, 1, 5);

  INSERT INTO INVENTORY (quantity, low_stock_threshold, product_id) VALUES
  (120, 20,  1),  -- Iced Americano
  (100, 20,  2),  -- Iced Latte
  (150, 25,  3),  -- Espresso
  ( 90, 15,  4),  -- Cappuccino
  ( 75, 15,  5),  -- Matcha Latte
  ( 80, 10,  6),  -- Iced Chamomile
  ( 60, 10,  7),  -- Butter Croissant
  ( 50, 10,  8),  -- Cheese Sandwich
  (100, 20,  9),  -- Lemon Fizz
  ( 90, 15, 10);  -- Strawberry Soda

  INSERT INTO CATROOMBOOKING (check_in, check_out, party_size, booking_fee, status, user_id) VALUES
  -- Today
  ('2026-05-16 09:00:00', '2026-05-16 10:30:00', 2, 300.00, 'completed', 2),
  ('2026-05-16 11:00:00', '2026-05-16 12:30:00', 3, 300.00, 'completed', 4),
  ('2026-05-16 13:00:00', '2026-05-16 14:30:00', 4, 300.00, 'active',    2),
  ('2026-05-16 15:00:00', '2026-05-16 16:30:00', 2, 300.00, 'confirmed', 4),
  ('2026-05-16 17:00:00', '2026-05-16 18:30:00', 5, 300.00, 'confirmed', 2),
  -- Yesterday
  ('2026-05-15 09:30:00', '2026-05-15 11:00:00', 2, 300.00, 'completed', 2),
  ('2026-05-15 11:30:00', '2026-05-15 13:00:00', 3, 300.00, 'completed', 4),
  ('2026-05-15 13:30:00', '2026-05-15 15:00:00', 4, 300.00, 'completed', 2),
  ('2026-05-15 15:30:00', '2026-05-15 17:00:00', 2, 300.00, 'completed', 4),
  ('2026-05-15 17:30:00', '2026-05-15 19:00:00', 3, 300.00, 'completed', 2),
  -- Two days ago
  ('2026-05-14 10:00:00', '2026-05-14 11:30:00', 2, 300.00, 'completed', 4),
  ('2026-05-14 12:00:00', '2026-05-14 13:30:00', 4, 300.00, 'completed', 2),
  ('2026-05-14 14:00:00', '2026-05-14 15:30:00', 3, 300.00, 'completed', 4),
  ('2026-05-14 16:00:00', '2026-05-14 17:30:00', 2, 300.00, 'completed', 2),
  ('2026-05-14 18:00:00', '2026-05-14 19:30:00', 5, 300.00, 'completed', 4);
 
 INSERT INTO `ORDER` (order_type, status, subtotal, total_amount, created_at, user_id, booking_id) VALUES
  -- Today
  ('walk_in',  'completed', 185.00, 185.00, '2026-05-16 09:30:00', 2, NULL),
  ('cat_room', 'completed', 270.00, 270.00, '2026-05-16 11:30:00', 4,    2),
  ('walk_in',  'completed', 165.00, 165.00, '2026-05-16 13:30:00', 2, NULL),
  ('cat_room', 'preparing', 390.00, 390.00, '2026-05-16 15:30:00', 4,    3),
  ('walk_in',  'preparing', 175.00, 175.00, '2026-05-16 17:30:00', 2, NULL),
  -- Yesterday
  ('walk_in',  'completed', 250.00, 250.00, '2026-05-15 09:00:00', 2, NULL),
  ('cat_room', 'completed', 360.00, 360.00, '2026-05-15 11:00:00', 4,    7),
  ('walk_in',  'completed', 180.00, 180.00, '2026-05-15 13:00:00', 2, NULL),
  ('cat_room', 'completed', 290.00, 290.00, '2026-05-15 15:00:00', 4,    8),
  ('walk_in',  'completed', 155.00, 155.00, '2026-05-15 17:00:00', 2, NULL),
  -- Two days ago
  ('walk_in',  'completed', 200.00, 200.00, '2026-05-14 10:30:00', 4, NULL),
  ('cat_room', 'completed', 440.00, 440.00, '2026-05-14 12:30:00', 2,   12),
  ('walk_in',  'completed', 170.00, 170.00, '2026-05-14 14:30:00', 4, NULL),
  ('cat_room', 'completed', 310.00, 310.00, '2026-05-14 16:30:00', 2,   13),
  ('walk_in',  'completed', 145.00, 145.00, '2026-05-14 18:30:00', 4, NULL);
 
 INSERT INTO ORDERITEM (quantity, unit_price, order_id, product_id) VALUES
  -- Order 1 · walk_in ₱185
  (1,  85.00,  1,  1),  -- Iced Americano
  (1, 100.00,  1,  2),  -- Iced Latte
  -- Order 2 · cat_room ₱270
  (2,  95.00,  2,  4),  -- Cappuccino ×2
  (1,  80.00,  2,  9),  -- Lemon Fizz
  -- Order 3 · walk_in ₱165
  (1,  65.00,  3,  3),  -- Espresso
  (1, 100.00,  3,  2),  -- Iced Latte
  -- Order 4 · cat_room ₱390
  (3, 110.00,  4,  5),  -- Matcha Latte ×3
  (1,  60.00,  4,  7),  -- Butter Croissant
  -- Order 5 · walk_in ₱175
  (1,  85.00,  5,  6),  -- Iced Chamomile
  (1,  90.00,  5, 10),  -- Strawberry Soda
  -- Order 6 · walk_in ₱250
  (2,  85.00,  6,  1),  -- Iced Americano ×2
  (1,  80.00,  6,  9),  -- Lemon Fizz
  -- Order 7 · cat_room ₱360
  (2, 110.00,  7,  5),  -- Matcha Latte ×2
  (1,  95.00,  7,  4),  -- Cappuccino
  (1,  60.00,  7,  7),  -- Butter Croissant (promo price)
  -- Order 8 · walk_in ₱180
  (2,  65.00,  8,  3),  -- Espresso ×2
  (1,  50.00,  8,  8),  -- Cheese Sandwich (promo price)
  -- Order 9 · cat_room ₱290
  (2, 100.00,  9,  2),  -- Iced Latte ×2
  (1,  90.00,  9, 10),  -- Strawberry Soda
  -- Order 10 · walk_in ₱155
  (1,  85.00, 10,  6),  -- Iced Chamomile
  (1,  70.00, 10,  8),  -- Cheese Sandwich (promo price)
  -- Order 11 · walk_in ₱200
  (2, 100.00, 11,  2),  -- Iced Latte ×2
  -- Order 12 · cat_room ₱440
  (2, 110.00, 12,  5),  -- Matcha Latte ×2
  (2,  85.00, 12,  1),  -- Iced Americano ×2
  (1,  60.00, 12,  7),  -- Butter Croissant
  -- Order 13 · walk_in ₱170
  (2,  65.00, 13,  3),  -- Espresso ×2
  (1,  40.00, 13,  8),  -- Cheese Sandwich (promo price)
  -- Order 14 · cat_room ₱310
  (1,  95.00, 14,  4),  -- Cappuccino
  (2,  80.00, 14,  9),  -- Lemon Fizz ×2
  (1,  55.00, 14,  7),  -- Butter Croissant
  -- Order 15 · walk_in ₱145
  (1,  65.00, 15,  3),  -- Espresso
  (1,  80.00, 15,  9);  -- Lemon Fizz

  INSERT INTO PAYMENT (method, booking_fee, order_total, grand_total, status, paid_at, user_id, order_id, booking_id) VALUES
  -- Today
  ('cash',  0.00,   185.00,  185.00, 'completed', '2026-05-16 09:35:00', 2,  1, NULL), -- Order 1 walk_in
  ('gcash', 300.00,   0.00,  300.00, 'completed', '2026-05-16 10:50:00', 4, NULL,  2), -- Booking 2 advance
  ('cash',  300.00, 270.00,  570.00, 'completed', '2026-05-16 11:35:00', 4,  2,    2), -- Order 2 + Booking 2
  ('gcash', 0.00,   165.00,  165.00, 'completed', '2026-05-16 13:35:00', 2,  3, NULL), -- Order 3 walk_in
  ('gcash', 300.00,   0.00,  300.00, 'completed', '2026-05-16 14:55:00', 4, NULL,  4), -- Booking 4 advance
  -- Yesterday
  ('cash',  0.00,   250.00,  250.00, 'completed', '2026-05-15 09:05:00', 2,  6, NULL), -- Order 6 walk_in
  ('gcash', 300.00,   0.00,  300.00, 'completed', '2026-05-15 10:45:00', 4, NULL,  7), -- Booking 7 advance
  ('cash',  300.00, 360.00,  660.00, 'completed', '2026-05-15 11:05:00', 4,  7,    7), -- Order 7 + Booking 7
  ('cash',  0.00,   180.00,  180.00, 'completed', '2026-05-15 13:05:00', 2,  8, NULL), -- Order 8 walk_in
  ('gcash', 300.00, 290.00,  590.00, 'completed', '2026-05-15 15:05:00', 4,  9,    8), -- Order 9 + Booking 8
  ('cash',  0.00,   155.00,  155.00, 'completed', '2026-05-15 17:05:00', 2, 10, NULL), -- Order 10 walk_in
  -- Two days ago
  ('cash',  0.00,   200.00,  200.00, 'completed', '2026-05-14 10:35:00', 4, 11, NULL), -- Order 11 walk_in
  ('gcash', 300.00,   0.00,  300.00, 'completed', '2026-05-14 11:55:00', 2, NULL, 12), -- Booking 12 advance
  ('cash',  300.00, 440.00,  740.00, 'completed', '2026-05-14 12:35:00', 2, 12,   12), -- Order 12 + Booking 12
  ('gcash', 0.00,   170.00,  170.00, 'completed', '2026-05-14 14:35:00', 4, 13, NULL), -- Order 13 walk_in
  ('cash',  300.00, 310.00,  610.00, 'completed', '2026-05-14 16:35:00', 2, 14,   13), -- Order 14 + Booking 13
  ('gcash', 0.00,   145.00,  145.00, 'completed', '2026-05-14 18:35:00', 4, 15, NULL); -- Order 15 walk_in

  INSERT INTO INVENTORYLOG (action, quantity_change, created_at, inventory_id, user_id) VALUES
  -- Restocks by admin (user_id 1)
  ('restock',   50, '2026-05-10 08:00:00',  1, 1),  -- Iced Americano
  ('restock',   50, '2026-05-10 08:05:00',  2, 1),  -- Iced Latte
  ('restock',  100, '2026-05-10 08:10:00',  3, 1),  -- Espresso
  ('restock',   40, '2026-05-12 09:00:00',  7, 1),  -- Butter Croissant
  ('restock',   40, '2026-05-12 09:05:00',  8, 1),  -- Cheese Sandwich
  ('restock',   60, '2026-05-13 08:30:00',  9, 1),  -- Lemon Fizz
  ('restock',   60, '2026-05-13 08:35:00', 10, 1),  -- Strawberry Soda
  -- Consumed – two days ago (2026-05-14)
  ('consumed',  -4, '2026-05-14 12:40:00',  2, 4),  -- Iced Latte
  ('consumed',  -4, '2026-05-14 12:45:00',  5, 2),  -- Matcha Latte
  ('consumed',  -3, '2026-05-14 16:40:00',  1, 4),  -- Iced Americano
  ('consumed',  -2, '2026-05-14 18:40:00',  9, 2),  -- Lemon Fizz
  -- Consumed – yesterday (2026-05-15)
  ('consumed',  -3, '2026-05-15 11:10:00',  5, 4),  -- Matcha Latte
  ('consumed',  -2, '2026-05-15 13:10:00',  3, 2),  -- Espresso
  ('consumed',  -2, '2026-05-15 15:10:00',  2, 4),  -- Iced Latte
  ('consumed',  -1, '2026-05-15 17:10:00',  6, 2),  -- Iced Chamomile
  -- Consumed – today (2026-05-16)
  ('consumed',  -2, '2026-05-16 11:40:00',  4, 4),  -- Cappuccino
  ('consumed',  -3, '2026-05-16 15:40:00',  5, 2),  -- Matcha Latte
  ('consumed',  -1, '2026-05-16 15:45:00',  7, 4),  -- Butter Croissant
  -- Restocks mid-week by admin
  ('restock',   30, '2026-05-15 08:00:00',  5, 1),  -- Matcha Latte top-up
  ('restock',   25, '2026-05-16 08:00:00',  4, 1);  -- Cappuccino top-up
