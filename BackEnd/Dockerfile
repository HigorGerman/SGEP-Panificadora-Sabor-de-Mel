# Estágio 1: Build (.NET 10 SDK)
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copia o arquivo de projeto e restaura dependências
COPY ["BackEnd/BackEnd.csproj", "BackEnd/"]
RUN dotnet restore "BackEnd/BackEnd.csproj"

# Copia todo o código-fonte do BackEnd e publica em modo Release
COPY . .
WORKDIR "/src/BackEnd"
RUN dotnet publish "BackEnd.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Estágio 2: Runtime (.NET 10 ASP.NET)
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

# Porta padrão caso a plataforma (Railway/Render) não injete a variável PORT
ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "BackEnd.dll"]

