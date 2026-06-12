import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import connectDB from './config/db.js';

dotenv.config();

const seedUsers = async () => {
  try {
    await connectDB();

    // Optionnel : On supprime tous les utilisateurs existants pour avoir une base propre
    // await User.deleteMany();
    // console.log('Anciens utilisateurs supprimés');

    const users = [
      {
        name: 'Super Admin',
        email: 'admin@seo.com',
        password: 'password123',
        role: 'admin',
        credits: 9999
      },
      {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'user',
        credits: 10
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
        password: 'password123',
        role: 'user',
        credits: 5
      },
      {
        name: 'Bob Test',
        email: 'bob@example.com',
        password: 'password123',
        role: 'user',
        credits: 0
      }
    ];

    // On parcourt les utilisateurs à insérer
    for (const userData of users) {
      // On vérifie si l'utilisateur existe déjà
      const userExists = await User.findOne({ email: userData.email });
      
      if (!userExists) {
        await User.create(userData);
        console.log(`Utilisateur créé : ${userData.email} (${userData.role})`);
      } else {
        console.log(`L'utilisateur ${userData.email} existe déjà, on l'ignore.`);
      }
    }

    console.log('🌱 Base de données initialisée avec succès !');
    process.exit();
  } catch (error) {
    console.error('Erreur lors du seeding :', error);
    process.exit(1);
  }
};

seedUsers();
