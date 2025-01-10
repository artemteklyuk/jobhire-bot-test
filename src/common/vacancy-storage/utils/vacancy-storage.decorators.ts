import { Types } from 'mongoose';

const metadataKey = Symbol('transformToObjectId');

export const TransformToObjectId = (target: any, propertyKey: string | symbol, parameterIndex: number) => {
  const existingParams: number[] = Reflect.getOwnMetadata(metadataKey, target, propertyKey) || [];
  existingParams.push(parameterIndex);
  Reflect.defineMetadata(metadataKey, existingParams, target, propertyKey);
};

export const FindByIdMethod = (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
  const originalMethod = descriptor.value;

  descriptor.value = function (...args: any[]) {
    const paramIndices: number[] = Reflect.getOwnMetadata(metadataKey, target, propertyKey) || [];

    paramIndices.forEach((index) => {
      if (typeof args[index] === 'string') {
        args[index] = new Types.ObjectId(args[index]);
      }
    });

    return originalMethod.apply(this, args);
  };
};
