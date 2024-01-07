import { Construct } from "constructs";
import { CfnCluster, CfnService, CfnTaskDefinition } from "aws-cdk-lib/aws-ecs";
import { Fn, Stack, StackProps, Tags } from "aws-cdk-lib";

export class CdkStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const vpcId = Fn.importValue("vpc-id");
    const ecrRepositoryUrl = Fn.importValue("ecr-repository-uri");

    // アカウントIDを取得
    const accountId = Stack.of(this).account;
    const tag = this.node.tryGetContext("tag");

    const ecrImageUri = `${ecrRepositoryUrl}:${tag}`;

    const cluster = new CfnCluster(this, "MyCluster", {});

    const taskDefinition = new CfnTaskDefinition(this, "TaskDefinition", {
      family: `homepage_${tag}`,
      cpu: "256",
      memory: "512",
      networkMode: "awsvpc",
      requiresCompatibilities: ["FARGATE"],
      executionRoleArn: `arn:aws:iam::${accountId}:role/ecsTaskExecutionRole`,
      containerDefinitions: [
        {
          name: "MyContainer",
          image: ecrImageUri,
          essential: true,
          portMappings: [
            {
              containerPort: 80,
              hostPort: 80,
            },
          ],
        },
      ],
    });

    new CfnService(this, "FargateService", {
      cluster: cluster.ref,
      desiredCount: 1,
      launchType: "FARGATE",
      taskDefinition: taskDefinition.ref,
      capacityProviderStrategy: [
        {
          capacityProvider: "FARGATE_SPOT", // 常にSPOTインスタンスを使用する（2024/01/07時点では安定性より料金を優先）
          base: 1,
        },
      ],
      networkConfiguration: {
        awsvpcConfiguration: {
          subnets: [], // 未実装
          securityGroups: [], // 未実装
          assignPublicIp: "DISABLED",
        },
      },
    });

    Tags.of(this).add("Project", "homepage");
  }
}
