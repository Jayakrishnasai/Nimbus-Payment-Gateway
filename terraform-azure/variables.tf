# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# NimbusCart — Azure Variables
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

variable "project" {
  description = "Project name"
  type        = string
  default     = "nimbuscart"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "production"
}

variable "location" {
  description = "Azure region"
  type        = string
  default     = "Central India"
}

variable "vnet_cidr" {
  description = "VNet address space"
  type        = string
  default     = "10.0.0.0/16"
}

variable "aks_node_count" {
  description = "Default AKS node count"
  type        = number
  default     = 3
}

variable "aks_node_vm_size" {
  description = "AKS node VM size"
  type        = string
  default     = "Standard_D2s_v3"
}

variable "aks_max_node_count" {
  description = "Maximum AKS node count for autoscaling"
  type        = number
  default     = 10
}

variable "db_admin_username" {
  description = "PostgreSQL admin username"
  type        = string
  default     = "nimbuscart_admin"
}

variable "db_admin_password" {
  description = "PostgreSQL admin password"
  type        = string
  sensitive   = true
}

variable "db_sku_name" {
  description = "PostgreSQL Flexible Server SKU"
  type        = string
  default     = "GP_Standard_D2s_v3"
}

variable "redis_sku" {
  description = "Azure Redis Cache SKU"
  type        = string
  default     = "Standard"
}

variable "redis_capacity" {
  description = "Azure Redis Cache capacity (family size)"
  type        = number
  default     = 1
}

variable "domain_name" {
  description = "Custom domain for the application"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Common resource tags"
  type        = map(string)
  default = {
    Project     = "NimbusCart"
    Environment = "Production"
    ManagedBy   = "Terraform"
  }
}
