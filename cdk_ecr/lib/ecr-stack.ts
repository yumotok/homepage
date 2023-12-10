import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class ECRStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    // ECRリポジトリの作成
    new cdk.aws_ecr.CfnRepository(this, 'EcrRepository', {
      repositoryName: 'divide-prod'
    });
  }
}
