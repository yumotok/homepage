import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export class ECRStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    // ECRリポジトリの作成
    const ecr = new cdk.aws_ecr.CfnRepository(this, "divide-prod", {
      repositoryName: "divide-prod",
      emptyOnDelete: true,
    });

    new cdk.CfnOutput(this, "ecr-repository-uri", {
      value: ecr.attrRepositoryUri,
      exportName: "ecr-repository-uri",
    });
  }
}
