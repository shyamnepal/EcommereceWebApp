using DataAcess.Entity;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DataAcess.Migrations
{
    [DbContext(typeof(ShoesEcommerceContext))]
    [Migration("20260302000000_AddPaymentFailureReasonToOrders")]
    public partial class AddPaymentFailureReasonToOrders : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                IF COL_LENGTH('dbo.Orders', 'PaymentFailureReason') IS NULL
                    ALTER TABLE [Orders] ADD [PaymentFailureReason] nvarchar(max) NULL;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PaymentFailureReason",
                table: "Orders");
        }
    }
}
