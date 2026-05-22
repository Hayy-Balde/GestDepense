.PHONY: help setup start stop restart clean db-refresh

# Couleurs pour l'affichage
GREEN := \033[0;32m
NC := \033[0m

help:
	@echo "Commandes disponibles:"
	@echo "  ${GREEN}make setup${NC}      - Prépare l'environnement complet (Backend & Frontend)"
	@echo "  ${GREEN}make start${NC}      - Démarre les serveurs Backend (Docker) et Frontend (Vite)"
	@echo "  ${GREEN}make stop${NC}       - Arrête les conteneurs Docker en arrière-plan"
	@echo "  ${GREEN}make restart${NC}    - Arrête et redémarre les conteneurs Docker"
	@echo "  ${GREEN}make db-refresh${NC} - Réinitialise la base de données (Fresh Migration)"
	@echo "  ${GREEN}make clean${NC}      - Supprime les dépendances (node_modules, vendor)"

setup:
	@echo "${GREEN}🚀 Préparation du Backend (Docker & Laravel)...${NC}"
	@cd backend && [ ! -f .env ] && cp .env.example .env || true
	@docker compose up -d
	@echo "Installation de Composer..."
	@docker compose exec app composer install
	@docker compose exec app php artisan key:generate
	@echo "Attente de la base de données..."
	@sleep 5
	@docker compose exec app php artisan migrate --force

	@echo "${GREEN}🎨 Préparation du Frontend (React)...${NC}"
	@cd frontend && [ ! -f .env ] && echo "VITE_API_URL=http://localhost:8000/api/v1" > .env || true
	@cd frontend && npm install

	@echo "${GREEN}✅ Préparation terminée ! Lancez 'make start'.${NC}"

start:
	@echo "${GREEN}🐳 Démarrage de l'API Backend...${NC}"
	@docker compose up -d
	@echo "${GREEN}⚛️ Démarrage de l'interface Frontend...${NC}"
	@cd frontend && npm run dev

stop:
	@echo "${GREEN}🛑 Arrêt des conteneurs Backend...${NC}"
	@docker compose down

restart: stop start

db-refresh:
	@echo "${GREEN}🗄️ Réinitialisation de la Base de données...${NC}"
	@docker compose exec app php artisan migrate:fresh

clean: stop
	@echo "${GREEN}🧹 Nettoyage des dépendances...${NC}"
	@rm -rf backend/vendor
	@rm -rf frontend/node_modules
	@rm -f backend/.env
	@rm -f frontend/.env
