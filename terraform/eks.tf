# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# NimbusCart — EKS Cluster
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 20.0"

  cluster_name    = "${var.project_name}-eks"
  cluster_version = var.eks_cluster_version

  vpc_id     = aws_vpc.main.id
  subnet_ids = aws_subnet.private[*].id

  cluster_endpoint_public_access  = true
  cluster_endpoint_private_access = true

  enable_irsa = true

  eks_managed_node_groups = {
    general = {
      name           = "${var.project_name}-nodes"
      instance_types = var.eks_node_instance_types
      desired_size   = var.eks_node_desired
      min_size       = var.eks_node_min
      max_size       = var.eks_node_max

      labels = {
        Environment = var.environment
        Project     = var.project_name
      }

      tags = {
        "k8s.io/cluster-autoscaler/enabled"                    = "true"
        "k8s.io/cluster-autoscaler/${var.project_name}-eks"    = "owned"
      }
    }
  }

  tags = { Name = "${var.project_name}-eks" }
}

# Cluster Autoscaler IAM
module "cluster_autoscaler_irsa" {
  source  = "terraform-aws-modules/iam/aws//modules/iam-role-for-service-accounts-eks"
  version = "~> 5.30"

  role_name = "${var.project_name}-cluster-autoscaler"

  attach_cluster_autoscaler_policy = true
  cluster_autoscaler_cluster_names = [module.eks.cluster_name]

  oidc_providers = {
    main = {
      provider_arn               = module.eks.oidc_provider_arn
      namespace_service_accounts = ["kube-system:cluster-autoscaler"]
    }
  }
}
