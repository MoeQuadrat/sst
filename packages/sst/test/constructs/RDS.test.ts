import { test, expect } from "vitest";
/* eslint-disable @typescript-eslint/ban-ts-comment*/

import { countResources, createApp, hasResource } from "./helper";
import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as rds from "aws-cdk-lib/aws-rds";
import * as secretsManager from "aws-cdk-lib/aws-secretsmanager";
import { App, Stack, RDS, RDSProps } from "../../dist/constructs/";

/////////////////////////////
// Test constructor
/////////////////////////////

test("cdk.cluster is props", async () => {
  const stack = new Stack(await createApp(), "stack");
  const cluster = new RDS(stack, "Cluster", {
    engine: "postgresql11.13",
    defaultDatabaseName: "acme",
    cdk: {
      cluster: {
        backupRetention: cdk.Duration.days(7),
      },
    },
  });
  expect(cluster.defaultDatabaseName).toBe("acme");
  expect(cluster.secretArn).toBeDefined();
  expect(cluster.clusterArn).toBeDefined();
  expect(cluster.clusterIdentifier).toBeDefined();
  expect(cluster.clusterEndpoint).toBeDefined();
  hasResource(stack, "AWS::RDS::DBCluster", {
    Engine: "aurora-postgresql",
    DatabaseName: "acme",
    DBClusterIdentifier: "test-app-cluster",
    EnableHttpEndpoint: true,
    EngineMode: "serverless",
    EngineVersion: "11.13",
    BackupRetentionPeriod: 7,
  });
});

test("cdk.cluster contains engine error", async () => {
  const stack = new Stack(await createApp(), "stack");
  expect(
    () =>
      // @ts-ignore Allow type casting
      new RDS(stack, "Cluster", {
        engine: "postgresql11.13",
        defaultDatabaseName: "acme",
        cdk: {
          cluster: {
            engine: rds.DatabaseClusterEngine.AURORA_MYSQL,
          },
        },
      } as RDSProps)
  ).toThrow(/Use "engine" instead of "cdk.cluster.engine"/);
});

test("cdk.cluster contains defaultDatabaseName error", async () => {
  const stack = new Stack(await createApp(), "stack");
  expect(
    () =>
      // @ts-ignore Allow type casting
      new RDS(stack, "Cluster", {
        engine: "postgresql11.13",
        defaultDatabaseName: "acme",
        cdk: {
          cluster: {
            defaultDatabaseName: "acme",
          },
        },
      } as RDSProps)
  ).toThrow(
    /Use "defaultDatabaseName" instead of "cdk.cluster.defaultDatabaseName"/
  );
});

test("cdk.cluster contains scaling error", async () => {
  const stack = new Stack(await createApp(), "stack");
  expect(
    () =>
      // @ts-ignore Allow type casting
      new RDS(stack, "Cluster", {
        engine: "postgresql11.13",
        defaultDatabaseName: "acme",
        cdk: {
          cluster: {
            scaling: {
              autoPause: cdk.Duration.minutes(5),
            },
          },
        },
      } as RDSProps)
  ).toThrow(/Use "scaling" instead of "cdk.cluster.scaling"/);
});

test("cdk.cluster contains enableDataApi error", async () => {
  const stack = new Stack(await createApp(), "stack");
  expect(
    () =>
      // @ts-ignore Allow type casting
      new RDS(stack, "Cluster", {
        engine: "postgresql11.13",
        defaultDatabaseName: "acme",
        cdk: {
          cluster: {
            enableDataApi: false,
          },
        },
      } as RDSProps)
  ).toThrow(/Do not configure the "cdk.cluster.enableDataApi"/);
});

test("cdk.cluster is construct", async () => {
  const stack = new Stack(await createApp(), "stack");
  const cluster = new RDS(stack, "Cluster", {
    engine: "postgresql11.13",
    defaultDatabaseName: "acme",
    cdk: {
      cluster: rds.ServerlessCluster.fromServerlessClusterAttributes(
        stack,
        "ICluster",
        {
          clusterIdentifier: "my-cluster",
        }
      ),
      secret: secretsManager.Secret.fromSecretAttributes(stack, "ISecret", {
        secretPartialArn:
          "arn:aws:secretsmanager:us-east-1:123456789012:secret:my-secret",
      }),
    },
  });
  countResources(stack, "AWS::RDS::DBCluster", 0);
  expect(cluster.defaultDatabaseName).toBe("acme");
  expect(cluster.secretArn).toBe(
    "arn:aws:secretsmanager:us-east-1:123456789012:secret:my-secret"
  );
});

test("cdk.cluster is construct: no secret error", async () => {
  const stack = new Stack(await createApp(), "stack");
  expect(
    () =>
      new RDS(stack, "Cluster", {
        engine: "postgresql11.13",
        defaultDatabaseName: "acme",
        cdk: {
          cluster: new rds.ServerlessCluster(stack, "MyCluster", {
            engine: rds.DatabaseClusterEngine.AURORA_MYSQL,
            defaultDatabaseName: "acme",
          }),
        },
      })
  ).toThrow(/Missing "cdk.secret"/);
});

test("defaultDatabaseName missing", async () => {
  const stack = new Stack(await createApp(), "stack");
  expect(
    () =>
      // @ts-ignore Allow type casting
      new RDS(stack, "Cluster", {
        engine: "postgresql11.13",
      } as RDSProps)
  ).toThrow(/defaultDatabaseName/);
});

test("engine missing", async () => {
  const stack = new Stack(await createApp(), "stack");
  expect(
    () =>
      // @ts-ignore Allow type casting
      new RDS(stack, "Cluster", {
        defaultDatabaseName: "acme",
      } as RDSProps)
  ).toThrow(/engine/);
});

test("engine invalid", async () => {
  const stack = new Stack(await createApp(), "stack");
  expect(
    () =>
      // @ts-ignore Allow type casting
      new RDS(stack, "Cluster", {
        engine: "invalid",
        defaultDatabaseName: "acme",
      } as RDSProps)
  ).toThrow(/engine/);
});

test("engine postgresql11.13", async () => {
  const stack = new Stack(await createApp(), "stack");
  new RDS(stack, "Cluster", {
    engine: "postgresql11.13",
    defaultDatabaseName: "acme",
  });
  hasResource(stack, "AWS::RDS::DBCluster", {
    Engine: "aurora-postgresql",
    EngineMode: "serverless",
    EngineVersion: "11.13",
  });
});

test("engine mysql5.6", async () => {
  const stack = new Stack(await createApp(), "stack");
  new RDS(stack, "Cluster", {
    engine: "mysql5.6",
    defaultDatabaseName: "acme",
  });
  hasResource(stack, "AWS::RDS::DBCluster", {
    Engine: "aurora",
    EngineMode: "serverless",
    EngineVersion: "5.6.10a",
  });
});

test("engine mysql5.7", async () => {
  const stack = new Stack(await createApp(), "stack");
  new RDS(stack, "Cluster", {
    engine: "mysql5.7",
    defaultDatabaseName: "acme",
  });
  hasResource(stack, "AWS::RDS::DBCluster", {
    Engine: "aurora-mysql",
    EngineMode: "serverless",
    EngineVersion: "5.7.mysql_aurora.2.07.1",
  });
});

test("scaling default", async () => {
  const stack = new Stack(await createApp(), "stack");
  new RDS(stack, "Cluster", {
    engine: "postgresql11.13",
    defaultDatabaseName: "acme",
  });
  hasResource(stack, "AWS::RDS::DBCluster", {
    ScalingConfiguration: {
      AutoPause: true,
      MaxCapacity: 16,
      MinCapacity: 2,
      SecondsUntilAutoPause: 300,
    },
  });
});

test("scaling autopause configured", async () => {
  const stack = new Stack(await createApp(), "stack");
  new RDS(stack, "Cluster", {
    engine: "postgresql11.13",
    defaultDatabaseName: "acme",
    scaling: {
      autoPause: 10,
      maxCapacity: "ACU_8",
      minCapacity: "ACU_4",
    },
  });
  hasResource(stack, "AWS::RDS::DBCluster", {
    ScalingConfiguration: {
      AutoPause: true,
      MaxCapacity: 8,
      MinCapacity: 4,
      SecondsUntilAutoPause: 600,
    },
  });
});

test("scaling autopause enabled", async () => {
  const stack = new Stack(await createApp(), "stack");
  new RDS(stack, "Cluster", {
    engine: "postgresql11.13",
    defaultDatabaseName: "acme",
    scaling: {
      autoPause: true,
    },
  });
  hasResource(stack, "AWS::RDS::DBCluster", {
    ScalingConfiguration: {
      AutoPause: true,
      MaxCapacity: 16,
      MinCapacity: 2,
      SecondsUntilAutoPause: 300,
    },
  });
});

test("scaling autopause disabled", async () => {
  const stack = new Stack(await createApp(), "stack");
  new RDS(stack, "Cluster", {
    engine: "postgresql11.13",
    defaultDatabaseName: "acme",
    scaling: {
      autoPause: false,
    },
  });
  hasResource(stack, "AWS::RDS::DBCluster", {
    ScalingConfiguration: {
      AutoPause: false,
      MaxCapacity: 16,
      MinCapacity: 2,
    },
  });
});

test("migrations", async () => {
  const stack = new Stack(await createApp(), "stack");
  new RDS(stack, "Cluster", {
    engine: "postgresql11.13",
    defaultDatabaseName: "acme",
    migrations: "test/constructs/migrations",
  });
});

test("migrations not found", async () => {
  const stack = new Stack(await createApp(), "stack");
  expect(
    () =>
      new RDS(stack, "Cluster", {
        engine: "postgresql11.13",
        defaultDatabaseName: "acme",
        migrations: "test/constructs/does/not/exist",
      })
  ).toThrow(/Cannot find the migrations/);
});

test("cdk.cluster.vpc not provided", async () => {
  const stack = new Stack(await createApp(), "stack");
  new RDS(stack, "Cluster", {
    engine: "postgresql11.13",
    defaultDatabaseName: "acme",
  });
  countResources(stack, "AWS::EC2::VPC", 1);
});

test("cdk.cluster.vpc provided", async () => {
  const stack = new Stack(await createApp(), "stack");
  new RDS(stack, "Cluster", {
    engine: "postgresql11.13",
    defaultDatabaseName: "acme",
    cdk: {
      cluster: {
        vpc: ec2.Vpc.fromVpcAttributes(stack, "VPC", {
          availabilityZones: ["us-east-1a"],
          publicSubnetIds: ["{PUBLIC-SUBNET-ID}"],
          privateSubnetIds: ["{PRIVATE-SUBNET-ID}"],
          isolatedSubnetIds: ["{ISOLATED-SUBNET-ID}"],
          vpcId: "{VPC-ID}",
        }),
      },
    },
  });
  countResources(stack, "AWS::EC2::VPC", 0);
});

test("cdk.cluster.credentials SSM error", async () => {
  const stack = new Stack(await createApp(), "stack");
  expect(
    () =>
      new RDS(stack, "Cluster", {
        engine: "postgresql11.13",
        defaultDatabaseName: "acme",
        cdk: {
          cluster: {
            credentials: rds.Credentials.fromPassword(
              "admin",
              cdk.SecretValue.ssmSecure("/password")
            ),
          },
        },
      })
  ).toThrow(/Only credentials managed by SecretManager are supported/);
});
