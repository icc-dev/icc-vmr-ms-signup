import { HydratedDocument } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { StatusTenantAvailable } from '../enums/tenant.enum';
import * as crypto from 'crypto';

export type TenantDocument = HydratedDocument<Tenant>;
@Schema({
  autoIndex: true,
  toJSON: { transform: omitSensitive },
})
export class Tenant {
  // Datetime management
  @Prop({
    type: Date,
    required: false,
  })
  createdAt: Date;
  @Prop({
    type: Date,
    required: false,
  })
  updatedAt: Date;
  @Prop({
    type: Date,
    required: false,
  })
  lastLogin: Date;

  // Status management
  @Prop({
    type: String,
    required: false,
    default: 'active',
    enum: StatusTenantAvailable,
  })
  status: StatusTenantAvailable;

  @Prop({
    type: String,
    required: true,
    lowercase: true,
    index: true,
    unique: true,
    trim: true,
  })
  email: string;
  @Prop({
    type: String,
    required: false,
    trim: true,
  })
  tenantId: string;
  @Prop({
    type: String,
    required: true,
    trim: true,
  })
  password: string;

  @Prop({
    type: String,
    required: false,
    trim: true,
  })
  domain: string;
}

export const TenantSchema = SchemaFactory.createForClass(Tenant);

TenantSchema.index({ email: 1 }, { unique: true, name: 'emailUniqueKey' });

TenantSchema.queue('setDefaultProperties', []);
TenantSchema.queue('setPassword', []);
TenantSchema.methods.setPassword = function () {
  // Creating a unique salt for a particular Tenant
  this.salt = crypto.randomBytes(16).toString('hex');
  // Hashing Tenant's salt and password with 1000 iterations,
  this.password = crypto
    .pbkdf2Sync(this.password, this.salt, 8000, 64, 'sha512')
    .toString('hex');
};
TenantSchema.methods.setDefaultProperties = function () {
  this.createdAt = new Date();
  this.updatedAt = new Date();
  this.tenantId = this._id.toString();
  this.domain = this.email.split('@')[1];
};

function omitSensitive(_doc, obj) {
  delete obj.password;
  return obj;
}
