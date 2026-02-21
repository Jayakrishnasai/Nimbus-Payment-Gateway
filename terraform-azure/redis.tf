# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# NimbusCart — Azure Cache for Redis
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

resource "azurerm_redis_cache" "main" {
  name                = "${var.project}-redis"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  capacity            = var.redis_capacity
  family              = "C"
  sku_name            = var.redis_sku
  enable_non_ssl_port = false
  minimum_tls_version = "1.2"
  tags                = var.tags

  redis_configuration {
    maxmemory_reserved              = 50
    maxmemory_delta                 = 50
    maxmemory_policy                = "allkeys-lru"
    notify_keyspace_events          = ""
    aof_backup_enabled              = false
  }

  patch_schedule {
    day_of_week    = "Sunday"
    start_hour_utc = 2
  }
}

# ── Private Endpoint for Redis ──
resource "azurerm_private_endpoint" "redis" {
  name                = "${var.project}-redis-pe"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  subnet_id           = azurerm_subnet.redis.id
  tags                = var.tags

  private_service_connection {
    name                           = "${var.project}-redis-psc"
    private_connection_resource_id = azurerm_redis_cache.main.id
    is_manual_connection           = false
    subresource_names              = ["redisCache"]
  }
}

# ── Diagnostic Settings ──
resource "azurerm_monitor_diagnostic_setting" "redis" {
  name                       = "${var.project}-redis-diagnostics"
  target_resource_id         = azurerm_redis_cache.main.id
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id

  metric {
    category = "AllMetrics"
    enabled  = true
  }
}
