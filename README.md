# AirWatch Mobile App 📱

App móvel para monitoramento da qualidade do ar em tempo real, desenvolvido com React Native e Expo.

## 📋 Pré-requisitos

### 1. Node.js e npm
- **Node.js**: v22.16.0 ou superior
- **npm**: v10.9.2 ou superior
- **Download**: [https://nodejs.org](https://nodejs.org)

### 2. NVM (Opcional, mas recomendado)
- **Versão**: v1.2.2 ou superior
- **Windows**: [https://github.com/coreybutler/nvm-windows](https://github.com/coreybutler/nvm-windows)
- **macOS/Linux**: [https://github.com/nvm-sh/nvm](https://github.com/nvm-sh/nvm)

### 3. Expo CLI
```bash
npm install -g @expo/cli
```

### 4. Expo Go App (RECOMENDADO)
- **Android**: [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
- **iOS**: [App Store](https://apps.apple.com/app/expo-go/id982107779)

## 🚀 Configuração do Projeto

### Passo 1: Verificar versões
```bash
node --version  # Deve mostrar v22.16.0 ou superior
npm --version   # Deve mostrar v10.9.2 ou superior
```

### Passo 2: Clonar e instalar dependências
```bash
mkdir airwatch-systems/ # Se não criou ainda
cd airwatch-systems
git clone https://github.com/AirWatch-Systems/airwatch-mobile.git
cd airwatch-mobile
npm install
```

### Passo 3: Configurar variáveis de ambiente
Crie um arquivo `.env` na raiz do projeto:
```bash
EXPO_PUBLIC_API_URL=http://0.0.0.0:5000
EXPO_PUBLIC_REQUEST_TIMEOUT_MS=15000 (opcional)
EXPO_PUBLIC_ENV=development (opcional)
```

### Passo 4: Iniciar o servidor de desenvolvimento
```bash
npm start
```

### Passo 5: Executar no celular (RECOMENDADO)
1. **Baixe o Expo Go** na loja de aplicativos do seu celular
2. **Execute** `npm start` no terminal
3. **Escaneie o QR Code** que aparece no terminal com:
   - **Android**: Câmera do celular ou app Expo Go
   - **iOS**: Câmera do celular
4. **Aguarde** o app carregar no seu celular

## 🛠️ Comandos Disponíveis

```bash
npm start          # Inicia o servidor de desenvolvimento
npm run android    # Executa no emulador Android (não recomendado)
npm run ios        # Executa no simulador iOS (não recomendado)
npm run web        # Executa no navegador
npm run lint       # Executa o linter
```

## 📱 Por que usar o celular?

**✅ RECOMENDADO: Celular físico com Expo Go**

- Melhor performance
- Acesso real aos sensores (GPS, câmera)
- Experiência mais próxima do usuário final
- Não requer configuração de emuladores

**❌ NÃO RECOMENDADO: Emuladores**

- Performance inferior
- Problemas com GPS e sensores
- Configuração complexa
- Consome mais recursos do computador

## 🔧 Solução de Problemas

### Erro de conexão com a API
- Verifique se o backend está rodando
- Confirme a URL no arquivo `.env`
- Para HTTPS: execute `dotnet dev-certs https --trust`

### QR Code não aparece
```bash
npx expo start --tunnel
```

### App não carrega no celular
- Certifique-se que celular e computador estão na mesma rede Wi-Fi
- Tente usar o modo tunnel: `npx expo start --tunnel`

## 📚 Tecnologias Utilizadas

- **React Native**: 0.81.5
- **Expo**: ~54.0.20
- **TypeScript**: ~5.9.2
- **React**: 19.1.0
- **Expo Router**: ~6.0.13
- **React Native Maps**: 1.20.1
- **Axios**: ^1.12.2

## 🌐 Links Úteis

- [Documentação do Expo](https://docs.expo.dev/)
- [React Native Maps](https://github.com/react-native-maps/react-native-maps)
- [Expo Router](https://docs.expo.dev/router/introduction/)
- [TypeScript](https://www.typescriptlang.org/)

## 🎯 Funcionalidades

- **Autenticação**: Login com 2FA
- **Localização**: GPS em tempo real
- **Qualidade do Ar**: Índices de poluição atuais
- **Feedbacks**: Sistema de avaliação da qualidade do ar
- **Mapas**: Visualização interativa
- **Pesquisa**: Busca por localizações
- **Perfil**: Gerenciamento de conta

## 📄 Licença

MIT License - veja o arquivo [LICENSE](LICENSE) para detalhes.
