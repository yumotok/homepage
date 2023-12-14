import { Stack, StackProps } from "aws-cdk-lib";
import { CfnSubnet, CfnVPC } from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";

class Context {
  project: string;
  env: string;
  constructor(stack: Stack) {
    this.project = stack.node.tryGetContext("project");
    this.env = stack.node.tryGetContext("env");
  }

    getResourceName(resource: string): string {
        return `${this.project}-${this.env}-${resource}`;
    }
}

export class BaseStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const context = new Context(this);

    const vpc = this.createVpc(context);
  }

  private createVpc(context: Context): CfnVPC {
    const vpc = new CfnVPC(this, "Vpc", {
      cidrBlock: "10.0.0.0/16",
      tags: [{ key: "Name", value: context.getResourceName("vpc") }],
    });
    return vpc;
  }

  private createSubnet(context: Context, vpc: CfnVPC): void {
    const subnet = new CfnSubnet(this, "SubnetPublic1a", {
      vpcId: vpc.ref,
      cidrBlock: "10.0.1.0/24",
      availabilityZone: "ap-northeast-1a",
      tags: [{ key: "Name", value: context.getResourceName("subnet-public-1a") }],
    });
  }
}
