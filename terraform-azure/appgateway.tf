# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# NimbusCart — Azure Application Gateway
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# ── Public IP for App Gateway ──
resource "azurerm_public_ip" "appgw" {
  name                = "${var.project}-appgw-pip"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  allocation_method   = "Static"
  sku                 = "Standard"
  zones               = ["1", "2", "3"]
  tags                = var.tags
}

# ── Application Gateway ──
resource "azurerm_application_gateway" "main" {
  name                = "${var.project}-appgw"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  tags                = var.tags

  sku {
    name     = "Standard_v2"
    tier     = "Standard_v2"
    capacity = 2
  }

  gateway_ip_configuration {
    name      = "appgw-ip-config"
    subnet_id = azurerm_subnet.appgw.id
  }

  frontend_ip_configuration {
    name                 = "appgw-frontend-ip"
    public_ip_address_id = azurerm_public_ip.appgw.id
  }

  frontend_port {
    name = "http-port"
    port = 80
  }

  frontend_port {
    name = "https-port"
    port = 443
  }

  # ── Backend: API ──
  backend_address_pool {
    name = "backend-api-pool"
  }

  backend_http_settings {
    name                  = "backend-api-settings"
    cookie_based_affinity = "Disabled"
    port                  = 3000
    protocol              = "Http"
    request_timeout       = 30
    probe_name            = "backend-health-probe"

    connection_draining {
      enabled           = true
      drain_timeout_sec = 30
    }
  }

  # ── Backend: Frontend ──
  backend_address_pool {
    name = "frontend-pool"
  }

  backend_http_settings {
    name                  = "frontend-settings"
    cookie_based_affinity = "Disabled"
    port                  = 80
    protocol              = "Http"
    request_timeout       = 30
  }

  # ── Health Probe ──
  probe {
    name                = "backend-health-probe"
    host                = "127.0.0.1"
    path                = "/health"
    interval            = 30
    timeout             = 10
    unhealthy_threshold = 3
    protocol            = "Http"
  }

  # ── HTTP Listener (redirect to HTTPS) ──
  http_listener {
    name                           = "http-listener"
    frontend_ip_configuration_name = "appgw-frontend-ip"
    frontend_port_name             = "http-port"
    protocol                       = "Http"
  }

  # ── Redirect HTTP → HTTPS ──
  redirect_configuration {
    name                 = "http-to-https"
    redirect_type        = "Permanent"
    target_listener_name = "https-listener"
    include_path         = true
    include_query_string = true
  }

  request_routing_rule {
    name                        = "http-redirect-rule"
    priority                    = 100
    rule_type                   = "Basic"
    http_listener_name          = "http-listener"
    redirect_configuration_name = "http-to-https"
  }

  # ── HTTPS Listener ──
  http_listener {
    name                           = "https-listener"
    frontend_ip_configuration_name = "appgw-frontend-ip"
    frontend_port_name             = "https-port"
    protocol                       = "Http" # Change to Https + ssl_certificate when cert is configured
  }

  # ── URL Path Map ──
  url_path_map {
    name                               = "path-map"
    default_backend_address_pool_name  = "frontend-pool"
    default_backend_http_settings_name = "frontend-settings"

    path_rule {
      name                       = "api-rule"
      paths                      = ["/api/*", "/health", "/socket.io/*"]
      backend_address_pool_name  = "backend-api-pool"
      backend_http_settings_name = "backend-api-settings"
    }
  }

  request_routing_rule {
    name               = "https-routing-rule"
    priority           = 200
    rule_type          = "PathBasedRouting"
    http_listener_name = "https-listener"
    url_path_map_name  = "path-map"
  }

  # ── WAF (upgrade to WAF_v2 SKU to enable) ──
  # waf_configuration {
  #   enabled          = true
  #   firewall_mode    = "Prevention"
  #   rule_set_type    = "OWASP"
  #   rule_set_version = "3.2"
  # }
}
