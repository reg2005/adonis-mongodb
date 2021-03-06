import { Exception } from '@poppinss/utils';

import { LoggerContract } from '@ioc:Adonis/Core/Logger';
import { MongodbContract, MongodbConfig } from '@ioc:Mongodb/Database';

import { Connection } from './Connection';

export class Mongodb implements MongodbContract {
  private $config: MongodbConfig;
  private $logger: LoggerContract;
  private $connections: Map<string, Connection>;
  private $defaultConnectionName: string;

  public constructor(config: MongodbConfig, logger: LoggerContract) {
    this.$config = config;
    this.$logger = logger;
    this.$defaultConnectionName = config.default;
    this.$connections = new Map();
    this._registerConnections();
  }

  private _registerConnections(): void {
    const config = this.$config.connections;
    for (const [connectionName, connectionConfig] of Object.entries(config)) {
      this.$connections.set(
        connectionName,
        new Connection(connectionName, connectionConfig, this.$logger),
      );
    }
  }

  public hasConnection(connectionName: string): boolean {
    return this.$connections.has(connectionName);
  }

  public connection(
    connectionName: string = this.$defaultConnectionName,
  ): Connection {
    if (!this.hasConnection(connectionName)) {
      throw new Exception(
        `no MongoDB connection registered with name "${connectionName}"`,
        500,
        'E_NO_MONGODB_CONNECTION',
      );
    }

    const connection = this.$connections.get(connectionName) as Connection;
    return connection;
  }

  public async closeConnections(): Promise<void> {
    await Promise.all(
      [...this.$connections.values()].map(async (connection) =>
        connection.close(),
      ),
    );
  }
}
