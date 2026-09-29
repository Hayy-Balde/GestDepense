.PHONY: help setup start stop clean deploy

# URLs officielles en production locale (VirtualHosts httpd, cf. deploy/httpd-fintrack.conf)
DEPLOY_HOST ?= fintrack.test
API_HOST ?= api.fintrack.test
VITE_API_URL ?= http://api.fintrack.test/api/v1

# Couleurs pour l'affichage
GREEN := \033[0;32m
NC := \033[0m

# Dossier de déploiement local (Frontend servi par httpd sur http://fintrack.test, Backend sur http://api.fintrack.test)
DEPLOY_DIR ?= /Users/admin/Sites/fin-track
DEPLOY_LINK ?= /Users/admin/Sites/fintrack

help:
	@echo "Commandes disponibles:"
	@echo "  ${GREEN}make setup${NC}      - Prépare l'environnement complet (Backend & Frontend)"
	@echo "  ${GREEN}make start${NC}      - Démarre le serveur Frontend (Vite)"
	@echo "  ${GREEN}make deploy${NC}     - Déploie fin-track dans $(DEPLOY_DIR) (accessible via http://fintrack.test)"
	@echo "  ${GREEN}make clean${NC}      - Supprime les dépendances (node_modules, vendor)"

setup:
	@echo "${GREEN}🚀 Préparation du Backend (Laravel)...${NC}"
	@cd backend && [ ! -f .env ] && cp .env.example .env || true
	@cd backend && composer install
	@cd backend && php artisan key:generate
	@cd backend && php artisan migrate:fresh
	@echo "${GREEN}🎨 Fin préparation du backend  (Succès)...${NC}"


	@echo "${GREEN}🎨 Préparation du Frontend (React)...${NC}"
	@cd frontend && [ ! -f .env ] && echo "VITE_API_URL=http://localhost:12000/api/v1" > .env || true
	@cd frontend && npm install

start_front:
	@echo "${GREEN}⚛️ Démarrage de l'interface Frontend...${NC}"
	@cd frontend && npm run dev

start_back:
	@echo "${GREEN}🐳 Démarrage de l'API Backend...${NC}"
	@cd backend && php artisan serve

start:
	tmux kill-session -t dev 2>/dev/null || true
	tmux new-session -d -s dev
# 	tmux send-keys -t dev 'echo "${GREEN}🐳 Démarrage de l\'API Backend...${NC}"' Enter
	tmux send-keys -t dev 'cd backend && php artisan serve --port 12000' Enter
	tmux split-window -h -t dev
# 	tmux send-keys -t dev 'echo "${GREEN}⚛️ Démarrage de l\'interface Frontend...${NC}"' Enter
	tmux send-keys -t dev 'cd frontend && npm run dev' Enter
	tmux attach -t dev


clear_backend:
	@echo "${GREEN}🐳 Nettoyage de l'API Backend...${NC}"
	@cd backend && php artisan optimize:clear

# ---------------------------------------------------------------------------
# Deploiement local vers /Users/admin/Sites/fin-track (deux sous-domaines)
#   • http://fintrack.test     → Frontend (SPA) dans $(DEPLOY_DIR)/frontend
#   • http://api.fintrack.test → Backend Laravel dans $(DEPLOY_DIR)/backend (public/)
# Aucun serveur a lancer, servi par Apache (VirtualHosts cf. deploy/httpd-fintrack.conf)
# ---------------------------------------------------------------------------
deploy:
	@echo "${GREEN}🚀 Déploiement de fin-track vers $(DEPLOY_DIR) (2 sous-domaines)...${NC}"
	@cd frontend && VITE_API_URL=$(VITE_API_URL) npm run build
	@echo "${GREEN}✓ Build frontend OK (API: $(VITE_API_URL))${NC}"
	@echo "${GREEN}✓ Copie du backend (sans .env local ni deps)...${NC}"
	@mkdir -p "$(DEPLOY_DIR)/backend" "$(DEPLOY_DIR)/frontend"
	@rsync -a --delete --exclude '.git' --exclude 'node_modules' --exclude '.DS_Store' --exclude '.env' backend/ "$(DEPLOY_DIR)/backend/"
	@cp -R frontend/dist/* "$(DEPLOY_DIR)/frontend/"
	@cp deploy/httpd-fintrack.conf "$(DEPLOY_DIR)/httpd-fintrack.conf"
	@cd "$(DEPLOY_DIR)/backend" && php artisan migrate --no-interaction >/dev/null 2>&1 || true
	@echo "   ✓ Frontend : http://$(DEPLOY_HOST)/  -> $(DEPLOY_DIR)/frontend"
	@echo "   ✓ Backend  : http://$(API_HOST)/     -> $(DEPLOY_DIR)/backend/public"
	@echo "${GREEN}✅ fin-track déployé${NC}"
	@echo "   (prérequis : '::1 fintrack.test' ET '::1 api.fintrack.test' dans /etc/hosts + VirtualHosts httpd cf. deploy/httpd-fintrack.conf)"

clean:
	@echo "${GREEN}🧹 Nettoyage des dépendances...${NC}"
	@rm -rf frontend/node_modules
	@rm -f frontend/.env
