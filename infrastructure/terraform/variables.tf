variable "location" {
  description = "Azure region for all resources"
  type        = string
  default     = "germanywestcentral"
}

variable "resource_prefix" {
  description = "Prefix for all resource names"
  type        = string
  default     = "fridgeai"
}

variable "vm_size" {
  description = "Azure VM size"
  type        = string
  default     = "Standard_D2s_v3"
}

variable "admin_username" {
  description = "Admin username for the VM"
  type        = string
  default     = "azureuser"
}

variable "ssh_public_key" {
  description = "SSH public key content (Ed25519 recommended)"
  type        = string
}
