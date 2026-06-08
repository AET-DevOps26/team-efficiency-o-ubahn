output "public_ip_address" {
  description = "Public IP address of the VM — add this as AZURE_PUBLIC_IP in your GitHub Environment"
  value       = azurerm_public_ip.main.ip_address
}

output "ssh_command" {
  description = "SSH command to connect to the VM"
  value       = "ssh -i <path-to-private-key.pem> ${var.admin_username}@${azurerm_public_ip.main.ip_address}"
}
