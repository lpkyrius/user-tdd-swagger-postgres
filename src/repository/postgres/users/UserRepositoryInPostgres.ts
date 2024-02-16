import crypto from 'crypto';
import { User } from '../../../entities/User';
import { IUserRepository } from "../../IUserRepository";
import { db } from '../../../services/postgres/postgres';



import * as fs from 'fs';
import { ManageUserTestFile } from '../../in-memory/users/ManageUserTestFile';


class UserRepositoryInPostgres implements IUserRepository {
  private readonly filePath: string;

  constructor() {
      const manageUserTestFile = new ManageUserTestFile();
      this.filePath = manageUserTestFile.getFile();
  }
  async add(user: User): Promise<User> {
    try {
      const newUser: User = { ...user, id: crypto.randomUUID(), created_at: new Date(new Date().toISOString()) };
      const savedUser = await db('users')
          .insert({
            id: newUser.id,
            email: newUser.email,
            password: newUser.password,
            role: newUser.role,
            created_at: newUser.created_at 
          })
          .returning('*');
          
      return savedUser[0];  
            
    } catch (error) {
        console.log(`Error in addUser(): ${error}`);
        throw error;
    }
  }

  async findUserByEmail(email: string): Promise<User> {
    try {
      const recoveredData = await db('users')
          .select('*')
          .from('users')
          .where({ email })

      if (recoveredData.length)
        return recoveredData;

      throw new Error('Email not found');
    } catch (error) {
        console.log(`Error in findUserByEmail(): ${ error }`)
        throw error;
    }
  }

  async update(user: User): Promise<User> {
      const users = this.readUsersFromFile();
      const index = users.findIndex((u) => u.id === user.id);
      if (index !== -1) {
          users[index] = user;
      this.writeUsersToFile(users);
      return user;
      }
      throw new Error('user not found');
  }

  async delete(id: string): Promise<boolean> {
      const users = this.readUsersFromFile();
      const initialLength = users.length;
      const filteredUsers = users.filter((u) => u.id !== id);
      if (filteredUsers.length !== initialLength) {
          this.writeUsersToFile(filteredUsers);
          return true;
      }
      return false;
  }

  async exists(id: string): Promise<boolean> {
    try {
      const recoveredData = await db('users')
          .select('*')
          .from('users')
          .where({ id })

      if (!recoveredData.length)
        return false;

      return true;
    } catch (error) {
        console.log(`Error in exists(): ${ error }`)
        throw error;
    }
  }

  async emailExists(email: string): Promise<boolean> {
    try {
      const recoveredData = await db('users')
          .select('*')
          .from('users')
          .where({ email })

      if (!recoveredData.length)
        return false;

      return true;
    } catch (error) {
        console.log(`Error in exists(): ${ error }`)
        throw error;
    }
  }

  async list(): Promise<User[]> {
      return this.readUsersFromFile();
  }

  async findUserById(id: string): Promise<User> {
      const users = this.readUsersFromFile();
      const index = users.findIndex((u) => u.id === id);
      if (index !== -1) {
          return users[index];
      }
      throw new Error('Id not found');
  }

  private readUsersFromFile(): User[] {
      const fileData = fs.readFileSync(this.filePath, 'utf-8');
      return JSON.parse(fileData);
  }

  private writeUsersToFile(users: User[]): void {
      // fs.writeFileSync(this.filePath, JSON.stringify(users, null, 2));
  }

}

export { UserRepositoryInPostgres };
