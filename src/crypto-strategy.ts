import * as crypto from 'node:crypto';

export class CryptoStrategy {
  private readonly algorithm: string;
  private readonly saltSize: number;

  public constructor(algorithm: string, saltSize = 128) {
    if (saltSize <= 0 || saltSize >= 190) {
      throw new Error('Wrong salt size');
    }

    this.algorithm = algorithm;
    this.saltSize = saltSize;
  }

  async hash(target: string): Promise<any> {
    const salt = crypto.randomBytes(this.saltSize).toString('base64');
    const value = await this.hashAsync(target, salt);

    return {
      value,
      salt,
    };
  }

  async verify(target: string, { value, salt }: any): Promise<boolean> {
    if (!salt) {
      throw new Error('No salt proved');
    }

    const targetHash = await this.hashAsync(target, salt);
    return targetHash === value;
  }

  private hashAsync(target: string, salt: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hmac = crypto.createHmac(this.algorithm, salt);

      hmac.end(target, () => resolve(hmac.read().toString('base64')));
      hmac.on('error', (err) => reject(err));
    });
  }
}
