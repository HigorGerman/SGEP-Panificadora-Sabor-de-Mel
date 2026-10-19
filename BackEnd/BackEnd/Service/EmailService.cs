using System;
using System.Net;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using MimeKit;
using MailKit.Net.Smtp;
using MailKit.Security;

namespace BackEnd.Services
{
    public class EmailService
    {
        private readonly IConfiguration _configuration;

        public EmailService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public async Task<bool> EnviarCodigoRecuperacaoSenhaAsync(string destinatarioEmail, string destinatarioNome, string codigoToken)
        {
            string assunto = "🔑 SGEP Panificadora Sabor de Mel - Código de Recuperação de Senha";
            string mensagemHtml = $@"
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;'>
                    <div style='background-color: #5B0A1A; color: #ffffff; padding: 20px; text-align: center;'>
                        <h2 style='margin: 0;'>SGEP - Panificadora Sabor de Mel</h2>
                    </div>
                    <div style='padding: 25px; color: #333333; line-height: 1.6;'>
                        <p>Olá, <strong>{WebUtility.HtmlEncode(destinatarioNome)}</strong>!</p>
                        <p>Recebemos uma solicitação para redefinir a senha da sua conta no SGEP.</p>
                        <p>Seu código de verificação é:</p>
                        <div style='text-align: center; margin: 25px 0;'>
                            <span style='font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #5B0A1A; background: #FFF5F5; padding: 12px 24px; border: 2px dashed #5B0A1A; border-radius: 8px; display: inline-block;'>
                                {codigoToken}
                            </span>
                        </div>
                        <p style='color: #e53e3e; font-size: 14px;'>⏱️ <strong>Atenção:</strong> Este código é válido por <strong>15 minutos</strong>.</p>
                        <p style='font-size: 13px; color: #718096;'>Se você não solicitou a alteração de senha, ignore este e-mail. Sua senha permanecerá inalterada.</p>
                    </div>
                    <div style='background-color: #f7fafc; padding: 15px; text-align: center; font-size: 12px; color: #a0aec0;'>
                        Panificadora Sabor de Mel • Sistema de Gestão de Encomendas
                    </div>
                </div>";

            return await EnviarEmailAsync(destinatarioEmail, assunto, mensagemHtml, codigoToken, "RECUPERACAO_SENHA");
        }

        public async Task<bool> EnviarCodigoExclusaoContaAsync(string destinatarioEmail, string destinatarioNome, string codigoToken)
        {
            string assunto = "⚠️ SGEP Panificadora Sabor de Mel - Confirmação de Exclusão de Conta";
            string mensagemHtml = $@"
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #feb2b2; border-radius: 8px; overflow: hidden;'>
                    <div style='background-color: #c53030; color: #ffffff; padding: 20px; text-align: center;'>
                        <h2 style='margin: 0;'>Confirmação de Exclusão de Conta</h2>
                    </div>
                    <div style='padding: 25px; color: #333333; line-height: 1.6;'>
                        <p>Olá, <strong>{WebUtility.HtmlEncode(destinatarioNome)}</strong>!</p>
                        <p>Recebemos uma solicitação para <strong>DESATIVAR E EXCLUIR</strong> sua conta na Panificadora Sabor de Mel.</p>
                        <p>Para confirmar esta ação irreversível, insira o código abaixo no sistema:</p>
                        <div style='text-align: center; margin: 25px 0;'>
                            <span style='font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #c53030; background: #FFF5F5; padding: 12px 24px; border: 2px dashed #c53030; border-radius: 8px; display: inline-block;'>
                                {codigoToken}
                            </span>
                        </div>
                        <p style='color: #e53e3e; font-size: 14px;'>⏱️ <strong>Atenção:</strong> O código expira em <strong>15 minutos</strong>.</p>
                        <p style='font-size: 13px; color: #718096;'>Se você não solicitou a exclusão da sua conta, entre em contato imediatamente com a equipe de suporte.</p>
                    </div>
                    <div style='background-color: #fff5f5; padding: 15px; text-align: center; font-size: 12px; color: #a0aec0;'>
                        Panificadora Sabor de Mel • Sistema de Gestão de Encomendas
                    </div>
                </div>";

            return await EnviarEmailAsync(destinatarioEmail, assunto, mensagemHtml, codigoToken, "EXCLUSAO_CONTA");
        }

        public async Task<bool> EnviarCodigoAlteracaoPerfilAsync(string destinatarioEmail, string destinatarioNome, string codigoToken)
        {
            string assunto = "🔒 SGEP Panificadora Sabor de Mel - Código para Alteração de Perfil";
            string mensagemHtml = $@"
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;'>
                    <div style='background-color: #5B0A1A; color: #ffffff; padding: 20px; text-align: center;'>
                        <h2 style='margin: 0;'>Confirmação de Alteração de Perfil</h2>
                    </div>
                    <div style='padding: 25px; color: #333333; line-height: 1.6;'>
                        <p>Olá, <strong>{WebUtility.HtmlEncode(destinatarioNome)}</strong>!</p>
                        <p>Recebemos uma solicitação para atualizar seus dados cadastrais ou senha no SGEP.</p>
                        <p>Para autorizar e salvar as alterações, utilize o código de 6 dígitos abaixo:</p>
                        <div style='text-align: center; margin: 25px 0;'>
                            <span style='font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #5B0A1A; background: #FFF5F5; padding: 12px 24px; border: 2px dashed #5B0A1A; border-radius: 8px; display: inline-block;'>
                                {codigoToken}
                            </span>
                        </div>
                        <p style='color: #e53e3e; font-size: 14px;'>⏱️ <strong>Atenção:</strong> Este código expira em <strong>15 minutos</strong>.</p>
                        <p style='font-size: 13px; color: #718096;'>Se você não fez essa solicitação, não compartilhe este código com ninguém.</p>
                    </div>
                    <div style='background-color: #f7fafc; padding: 15px; text-align: center; font-size: 12px; color: #a0aec0;'>
                        Panificadora Sabor de Mel • Sistema de Gestão de Encomendas
                    </div>
                </div>";

            return await EnviarEmailAsync(destinatarioEmail, assunto, mensagemHtml, codigoToken, "ALTERACAO_PERFIL");
        }

        public async Task<bool> EnviarNotificacaoInadimplenciaAsync(string destinatarioEmail, string destinatarioNome, int qtdPendentes, decimal valorTotalDevido)
        {
            string assunto = "⚠️ Panificadora Sabor de Mel - Aviso de Pendência Financeira em Encomendas";
            string mensagemHtml = $@"
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #fed7aa; border-radius: 8px; overflow: hidden;'>
                    <div style='background-color: #7A1C31; color: #ffffff; padding: 20px; text-align: center;'>
                        <h2 style='margin: 0;'>Panificadora Sabor de Mel</h2>
                        <p style='margin: 5px 0 0 0; opacity: 0.9;'>Aviso de Pendências em Aberto</p>
                    </div>
                    <div style='padding: 25px; color: #333333; line-height: 1.6;'>
                        <p>Olá, <strong>{WebUtility.HtmlEncode(destinatarioNome)}</strong>!</p>
                        <p>Identificamos em nosso sistema <strong>{qtdPendentes} encomenda(s)</strong> com pagamento pendente ou saldo a acertar na panificadora.</p>
                        <div style='background-color: #fff7ed; border-left: 4px solid #f97316; padding: 15px; margin: 20px 0; border-radius: 4px;'>
                            <p style='margin: 0; font-size: 14px; color: #9a3412;'><strong>Valor Total em Aberto:</strong></p>
                            <p style='margin: 5px 0 0 0; font-size: 24px; font-weight: bold; color: #c2410c;'>
                                R$ {valorTotalDevido.ToString("N2", System.Globalization.CultureInfo.GetCultureInfo("pt-BR"))}
                            </p>
                        </div>
                        <p>Para evitar restrições em novos pedidos online, por favor compareça ao balcão da panificadora ou entre em contato conosco para regularizar sua situação.</p>
                        <p style='font-size: 13px; color: #718096; margin-top: 20px;'>Caso já tenha efetuado o pagamento recentemente, por favor desconsidere este aviso.</p>
                    </div>
                    <div style='background-color: #f7fafc; padding: 15px; text-align: center; font-size: 12px; color: #a0aec0;'>
                        Panificadora Sabor de Mel • Atendimento ao Cliente
                    </div>
                </div>";

            return await EnviarEmailAsync(destinatarioEmail, assunto, mensagemHtml, "COBRANCA", "AVISO_INADIMPLENCIA");
        }

        private async Task<bool> EnviarEmailAsync(string destinatarioEmail, string assunto, string mensagemHtml, string codigoToken, string tipoToken)
        {
            var host = _configuration["Smtp:Host"];
            var portStr = _configuration["Smtp:Port"];
            var username = _configuration["Smtp:Username"];
            var password = _configuration["Smtp:Password"];
            var apiKey = _configuration["Smtp:ApiKey"] ?? password;
            var fromEmail = _configuration["Smtp:FromEmail"] ?? "onboarding@resend.dev";
            var fromName = _configuration["Smtp:FromName"] ?? "Panificadora Sabor de Mel";

            // Se for chave da Resend API (começa com "re_")
            if (!string.IsNullOrWhiteSpace(apiKey) && apiKey.Trim().StartsWith("re_"))
            {
                try
                {
                    using var httpClient = new System.Net.Http.HttpClient();
                    httpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", apiKey.Trim());

                    var payload = new
                    {
                        from = $"{fromName} <{fromEmail}>",
                        to = new[] { destinatarioEmail },
                        subject = assunto,
                        html = mensagemHtml
                    };

                    var jsonContent = new System.Net.Http.StringContent(
                        System.Text.Json.JsonSerializer.Serialize(payload),
                        System.Text.Encoding.UTF8,
                        "application/json"
                    );

                    var response = await httpClient.PostAsync("https://api.resend.com/emails", jsonContent);
                    if (response.IsSuccessStatusCode)
                    {
                        Console.WriteLine($"✅ [Resend API] E-mail enviado com SUCESSO para {destinatarioEmail}!");
                        return true;
                    }
                    else
                    {
                        string erroBody = await response.Content.ReadAsStringAsync();
                        Console.WriteLine($"⚠️ [Resend ERRO {response.StatusCode}]: {erroBody}");
                    }
                }
                catch (Exception resendEx)
                {
                    Console.WriteLine($"⚠️ [Resend ERRO]: {resendEx.Message}");
                }
            }

            if (string.IsNullOrWhiteSpace(host) || string.IsNullOrWhiteSpace(username))
            {
                Console.WriteLine($"\n=======================================================");
                Console.WriteLine($"📧 [E-MAIL SIMULADO ({tipoToken})]");
                Console.WriteLine($"Para: {destinatarioEmail}");
                Console.WriteLine($"Assunto: {assunto}");
                Console.WriteLine($"🔑 CÓDIGO TOKEN DE 6 DÍGITOS: [{codigoToken}]");
                Console.WriteLine($"=======================================================\n");
                return true;
            }

            try
            {
                int port = int.TryParse(portStr, out int p) ? p : 587;

                var message = new MimeMessage();
                message.From.Add(new MailboxAddress(fromName, fromEmail));
                message.To.Add(new MailboxAddress("", destinatarioEmail));
                message.Subject = assunto;

                var bodyBuilder = new BodyBuilder { HtmlBody = mensagemHtml };
                message.Body = bodyBuilder.ToMessageBody();

                using var client = new MailKit.Net.Smtp.SmtpClient();
                client.ServerCertificateValidationCallback = (s, c, ch, e) => true;
                var options = port == 465 ? SecureSocketOptions.SslOnConnect : SecureSocketOptions.StartTls;
                await client.ConnectAsync(host, port, options);
                await client.AuthenticateAsync(username?.Trim() ?? "", password?.Trim() ?? "");
                await client.SendAsync(message);
                await client.DisconnectAsync(true);

                Console.WriteLine($"✅ [SMTP MailKit] E-mail enviado com sucesso para {destinatarioEmail}");
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"⚠️ [SMTP ERRO] Falha ao enviar e-mail via servidor SMTP: {ex.Message}");
                Console.WriteLine($"📧 [LOG DE FALLBACK] E-mail para: {destinatarioEmail} | Código Token: [{codigoToken}]");
                return true;
            }
        }
    }
}
