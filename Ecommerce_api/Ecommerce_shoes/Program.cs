using DataAcess;
using DataAcess.Entity;
using DataAcess.Entity.OrderAggregate;
using Ecommerce_shoes.Attribute;
using Ecommerce_shoes.Middleware;
using Ecommerce_shoes.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Internal;
using Microsoft.Extensions.FileProviders;
using Microsoft.IdentityModel.Tokens;
using Scalar.AspNetCore;
using Serilog;
using Serilog.Events;
using ShoesRepository;
using ShoesRepository.GenreicRepo;
using shoesServices;
using ShoesShared.MailServics;
using System;
using System.Text;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

var _GetConnectionString = builder.Configuration.GetConnectionString("DefaultConnectionString");
builder.Services.AddDbContext<ShoesEcommerceContext>(options => options.UseSqlServer(_GetConnectionString));
// Add services to the container.
builder.Services.AddTransient<IAccountServices, AccountServices>();
builder.Services.AddTransient<IAccountRepository, AccountRepository>();
builder.Services.AddTransient(typeof(IGenericRepository<>), typeof(GenricRepository<>));
builder.Services.AddScoped<IMailServices, MailServices>();
builder.Services.AddScoped<IOrderRepository, OrderRepository>();
builder.Services.AddScoped<IPaymentRepository, PaymentRepository>();
// Basket: in-memory (no Redis). Cart is in localStorage; checkout sends items in CreateOrder.
builder.Services.AddSingleton<IBasketRepository, InMemoryBasketRepository>();
builder.Services.AddSingleton<ICloudflareR2Service, CloudflareR2Service>();
builder.Services.AddHttpClient();
builder.Services.AddScoped<IChatService, OpenAIChatService>();
builder.Services.AddAutoMapper(typeof(Program));


// For Identity  
builder.Services.AddIdentity<User, IdentityRole>()
                .AddEntityFrameworkStores<ShoesEcommerceContext>()
                .AddDefaultTokenProviders();


//for cross origin 
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowSpecificOrigin",
        policy => policy
            .WithOrigins("http://localhost:5173", "http://localhost:5174", "https://localhost:5173", "https://localhost:7148") // Vite dev (ecommerce-ui)
            .AllowAnyMethod()
            .AllowAnyHeader());
});

//for jwt auth
builder.Services.AddAuthentication(option =>
{
    option.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    option.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    option.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]))
    };
});


builder.Services.Configure<DataProtectionTokenProviderOptions>(opt =>
   opt.TokenLifespan = TimeSpan.FromMinutes(10));

//Add logger configuration
builder.Host.UseSerilog((context, configuraton) =>
configuraton.ReadFrom.Configuration(context.Configuration).Enrich.FromLogContext());
builder.Services.AddControllers(options =>
{
    options.Filters.Add<ApiKeyAuthorizationFilter>();
})
.AddJsonOptions(options =>
{
    options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
});
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddOpenApi(); // Built-in OpenAPI (no Swashbuckle)

var app = builder.Build();

// Apply pending schema updates (e.g. Orders.PaymentFailureReason) then seed checkout data
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<DataAcess.Entity.ShoesEcommerceContext>();
    db.Database.Migrate();
    if (!db.DeliveryMethods.Any())
    {
        db.DeliveryMethods.Add(new DeliveryMethod
        {
            ShortName = "Standard",
            DeliveryTime = "3-5 days",
            Description = "Standard delivery",
            Price = 0
        });
        db.SaveChanges();
    }
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();           // Serves OpenAPI at /openapi/v1.json
    app.MapScalarApiReference(options => options.WithTitle("MyAPI"));
}


// Update the ConfigureExceptionHandler call to pass the required IConfiguration parameter
app.ConfigureExceptionHandler(builder.Configuration);



// Force HTTPS (should come early in the pipeline)
app.UseHttpsRedirection();

// Serve Static Files (place after exception handler and API key middleware)
//app.UseStaticFiles(new StaticFileOptions
//{
//    FileProvider = new PhysicalFileProvider(
//        Path.Combine(builder.Environment.ContentRootPath, "wwwroot", "Image")),
//    RequestPath = "/Image"
//});
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(
        Path.Combine(builder.Environment.ContentRootPath, "Image")),
    RequestPath = "/Image"
});

// CORS - Make sure this comes before authentication/authorization middleware
app.UseCors("AllowSpecificOrigin");

// Authentication middleware (JWT or cookie-based, etc.)
app.UseAuthentication();

// Authorization middleware (for role-based or claims-based authorization)
app.UseAuthorization();

// Route Mapping (it should come after authentication/authorization logic)
app.MapControllers();

// Show a clear message when the app is actually listening
app.Lifetime.ApplicationStarted.Register(() =>
{
    Console.WriteLine();
    Console.WriteLine("Application started. Open https://localhost:7247/scalar or http://localhost:5232/scalar for API docs.");
    Console.WriteLine();
});

// Run the application
app.Run();

