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

type AvailabilityZone = "ap-northeast-1a" | "ap-northeast-1c";

export class BaseStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const context = new Context(this);

    const vpc = this.createVpc(context);
    const subnets = [
      this.createSubnet(
        context,
        vpc,
        "10.0.11.0/24",
        "ap-northeast-1a",
        "subnet-public-1a"
      ),
      this.createSubnet(
        context,
        vpc,
        "10.0.12.0/24",
        "ap-northeast-1c",
        "subnet-public-1c"
      ),
      this.createSubnet(
        context,
        vpc,
        "10.0.21.0/24",
        "ap-northeast-1a",
        "subnet-app-1a"
      ),
      this.createSubnet(
        context,
        vpc,
        "10.0.22.0/24",
        "ap-northeast-1c",
        "subnet-app-1c"
      ),
      this.createSubnet(
        context,
        vpc,
        "10.0.31.0/24",
        "ap-northeast-1a",
        "subnet-private-1a"
      ),
      this.createSubnet(
        context,
        vpc,
        "10.0.32.0/24",
        "ap-northeast-1c",
        "subnet-private-1c"
      ),
    ];
  }

  private createVpc(context: Context): CfnVPC {
    const vpc = new CfnVPC(this, "Vpc", {
      cidrBlock: "10.0.0.0/16",
      tags: [{ key: "Name", value: context.getResourceName("vpc") }],
    });
    return vpc;
  }

  private createSubnet(
    context: Context,
    vpc: CfnVPC,
    cidrBlock: string,
    availabilityZone: AvailabilityZone,
    resourceName: string
  ): CfnSubnet {
    const subnet = new CfnSubnet(this, resourceName, {
      vpcId: vpc.ref,
      cidrBlock: cidrBlock,
      availabilityZone: availabilityZone,
      tags: [{ key: "Name", value: context.getResourceName(resourceName) }],
    });
    return subnet;
  }
}
