import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from '../../database/entities/customer.entity';

@Injectable()
export class CustomersService {
  constructor(@InjectRepository(Customer) private repo: Repository<Customer>) {}

  findAll(activeOnly = true) {
    const where = activeOnly ? { isActive: true } : {};
    return this.repo.find({ where, order: { name: 'ASC' } });
  }

  async findOne(id: string) {
    const c = await this.repo.findOne({ where: { id } });
    if (!c) throw new NotFoundException('Customer not found');
    return c;
  }

  create(data: Partial<Customer>) {
    const { outstandingDebt, ...rest } = data as any;
    return this.repo.save(this.repo.create({ ...rest, outstandingDebt: 0 }));
  }

  async update(id: string, data: Partial<Customer>) {
    await this.findOne(id);
    const { outstandingDebt, id: _id, createdAt, updatedAt, ...safe } = data as any;
    if (Object.keys(safe).length === 0) throw new BadRequestException('No updatable fields');
    await this.repo.update(id, safe);
    return this.findOne(id);
  }
}
