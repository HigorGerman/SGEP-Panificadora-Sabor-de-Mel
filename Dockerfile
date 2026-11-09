# Estágio 1: Build (.NET 10 SDK) - Contexto na raiz do repositório
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY ["BackEnd/BackEnd/BackEnd.csproj", "BackEnd/BackEnd/"]
RUN dotnet restore "BackEnd/BackEnd/BackEnd.csproj"

COPY BackEnd/ BackEnd/
WORKDIR "/src/BackEnd/BackEnd"
RUN dotnet publish "BackEnd.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Estágio 2: Runtime (.NET 10 ASP.NET)
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "BackEnd.dll"]

