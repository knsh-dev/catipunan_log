'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('USER', [
      {
        full_name: 'Admin User',
        email: 'admin@catipunan.com',
        role: 'admin',
        username: 'admin',
        // password: admin1234
        password_hash: '$2a$12$loNOu8vn5zg.yG26g4h10.c9lROzD1ppXpZvsGa8RicYhjtgUvTE.',
        created_at: new Date(),
      },
      {
        full_name: 'Juan Cruz',
        email: 'juan@catipunan.com',
        role: 'cashier',
        username: 'juanc',
        // password: cashier1234
        password_hash: '$2a$12$2Nf5UVstHgcQRPuhgNfF6eYhK3.4XbwMFvTC3Ed8wvFND0M5vR8aS',
        created_at: new Date(),
      },
      {
        full_name: 'Maria Reyes',
        email: 'maria@catipunan.com',
        role: 'staff',
        username: 'mariar',
        // password: staff1234
        password_hash: '$2a$12$LhEsW.BWgq4jx8SFPX7d1eiOQ6vKnP8X4showC/25YD/vItvPcZ.6',
        created_at: new Date(),
      },
      {
        full_name: 'Carlos Santos',
        email: 'carlos@catipunan.com',
        role: 'cashier',
        username: 'carlosg',
        // password: cashier5678
        password_hash: '$2a$12$3Kg7XVwtJhcRQSviOHgG7eZiL5.5YcxNGwUD4Fe9xwGOE1N6wS9bT',
        created_at: new Date(),
      },
      {
        full_name: 'Ana Villanueva',
        email: 'ana@catipunan.com',
        role: 'staff',
        username: 'anav',
        // password: staff5678
        password_hash: '$2a$12$4Mh8YWxuKidSRTwjPIhH8fAjM6.6ZdyOHxVE5Gf0yxHPF2O7xT0cU',
        created_at: new Date(),
      },
    ], {});
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('USER', null, {});
  },
};