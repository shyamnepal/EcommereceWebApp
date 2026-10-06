using System;
using System.Collections.Generic;
using System.Reflection.Emit;
using DataAcess.Entity.OrderAggregate;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using static System.Net.Mime.MediaTypeNames;

namespace DataAcess.Entity;

public partial class ShoesEcommerceContext : IdentityDbContext<User>
{
    public ShoesEcommerceContext()
    {
    }

    public ShoesEcommerceContext(DbContextOptions<ShoesEcommerceContext> options)
        : base(options)
    {
    }
   
    public virtual DbSet<Category> Categories { get; set; }

    public virtual DbSet<Product> Products { get; set; }
    public virtual DbSet<Address> Addrs { get; set; }
    public virtual DbSet<User> Users { get; set; }

    public virtual DbSet<UserVerification> UserVerifications { get; set; }
    public virtual DbSet<Order> Orders { get; set; }
    public virtual DbSet<OrderItem> OrderItems { get; set; }
    public virtual DbSet<DeliveryMethod> DeliveryMethods { get; set; }
    public virtual DbSet<ProductImage> ProductImages { get; set; }
   


 
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {

        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Category>(entity =>
        {
            entity.HasKey(e => e.CategoryId).HasName("PK__Category__19093A0B8CDE6E70");

            entity.ToTable("Category");

            entity.Property(e => e.CategoryId).ValueGeneratedNever();
            entity.Property(e => e.CategoryName)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.Description)
                .HasMaxLength(255)
                .IsUnicode(false);
        });

        modelBuilder.Entity<Product>(entity =>
        {
            entity.HasKey(e => e.ProductId).HasName("PK__Product__B40CC6CD21206A8D");

            entity.ToTable("Product");

            entity.Property(e => e.ProductId).ValueGeneratedNever();
            entity.Property(e => e.Description)
                .HasMaxLength(255)
                .IsUnicode(false);
            entity.Property(e => e.Price).HasColumnType("decimal(16, 2)");
            entity.Property(e => e.ProductName)
                .HasMaxLength(50)
                .IsUnicode(false);

            entity.HasOne(d => d.Category).WithMany(p => p.Products)
                .HasForeignKey(d => d.CategoryId)
                .HasConstraintName("CategoryId_pk");

        });

        modelBuilder.Entity<ProductImage>(entity =>
        {
            entity.HasKey(e => e.ImageId);
            entity.Property(e => e.ImageUrl)
            .IsRequired()
            .HasMaxLength(255);

            entity.Property(e => e.ImageAltText)
            .HasMaxLength(255);
            entity.Property(e => e.createdAt)
            .HasDefaultValueSql("GETDATE()");
            entity.HasOne(d => d.product)
                  .WithMany(t => t.ProductImages)
                  .HasForeignKey(d => d.ProductId)
                  .OnDelete(DeleteBehavior.Cascade);

        });

        modelBuilder.Entity<User>(entity =>
        {
           

            
            entity.Property(e => e.Address)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.Email)
                .HasMaxLength(70)
                .IsUnicode(false);
 
            entity.Property(e => e.UserName)
                .HasMaxLength(30)
                .IsUnicode(false);

            entity.HasOne(u => u.UsezrVerification)
                .WithOne(uv => uv.User)
                .HasForeignKey<UserVerification>(uv => uv.UserId)
                .IsRequired(false);
        });

        modelBuilder.Entity<IdentityUserClaim<string>>()
        .HasOne<User>()
        .WithMany()
        .HasForeignKey(claim => claim.UserId); // Use a different property if needed

        modelBuilder.Entity<UserVerification>(entity =>
        {
            entity.Property(e => e.UserId)
                .IsRequired();

            // Other configurations...
        });

    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);

}
