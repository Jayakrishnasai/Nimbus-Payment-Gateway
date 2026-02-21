# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# NimbusCart — Azure Kubernetes Service (AKS)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

resource "azurerm_kubernetes_cluster" "main" {
  name                = "${var.project}-aks"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  dns_prefix          = "${var.project}-aks"
  kubernetes_version  = "1.28"
  sku_tier            = "Standard"
  tags                = var.tags

  default_node_pool {
    name                = "system"
    node_count          = var.aks_node_count
    vm_size             = var.aks_node_vm_size
    vnet_subnet_id      = azurerm_subnet.aks.id
    os_disk_size_gb     = 50
    os_disk_type        = "Managed"
    max_pods            = 110
    enable_auto_scaling = true
    min_count           = 2
    max_count           = var.aks_max_node_count
    zones               = ["1", "2", "3"]

    node_labels = {
      "role" = "system"
    }
  }

  identity {
    type = "SystemAssigned"
  }

  network_profile {
    network_plugin    = "azure"
    network_policy    = "calico"
    load_balancer_sku = "standard"
    service_cidr      = "10.1.0.0/16"
    dns_service_ip    = "10.1.0.10"
  }

  oms_agent {
    log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id
  }

  azure_active_directory_role_based_access_control {
    managed                = true
    azure_rbac_enabled     = true
  }

  auto_scaler_profile {
    balance_similar_node_groups = true
    scale_down_delay_after_add  = "10m"
    scale_down_unneeded         = "10m"
  }

  key_vault_secrets_provider {
    secret_rotation_enabled  = true
    secret_rotation_interval = "5m"
  }

  lifecycle {
    ignore_changes = [default_node_pool[0].node_count]
  }
}

# ── Application Node Pool ──
resource "azurerm_kubernetes_cluster_node_pool" "app" {
  name                  = "app"
  kubernetes_cluster_id = azurerm_kubernetes_cluster.main.id
  vm_size               = var.aks_node_vm_size
  node_count            = 2
  enable_auto_scaling   = true
  min_count             = 2
  max_count             = 8
  vnet_subnet_id        = azurerm_subnet.aks.id
  os_disk_size_gb       = 50
  zones                 = ["1", "2", "3"]
  tags                  = var.tags

  node_labels = {
    "role" = "app"
  }

  node_taints = []

  lifecycle {
    ignore_changes = [node_count]
  }
}

# ── Log Analytics Workspace ──
resource "azurerm_log_analytics_workspace" "main" {
  name                = "${var.project}-logs"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  sku                 = "PerGB2018"
  retention_in_days   = 30
  tags                = var.tags
}

# ── ACR Pull permission for AKS ──
resource "azurerm_role_assignment" "aks_acr_pull" {
  principal_id                     = azurerm_kubernetes_cluster.main.kubelet_identity[0].object_id
  role_definition_name             = "AcrPull"
  scope                            = azurerm_container_registry.main.id
  skip_service_principal_aad_check = true
}
