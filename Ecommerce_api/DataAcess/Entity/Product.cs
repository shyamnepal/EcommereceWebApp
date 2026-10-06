using System;
using System.Collections.Generic;

namespace DataAcess.Entity;

public partial class Product
{

    public int ProductId { get; set; }

    public int? CategoryId { get; set; }

    public string ProductName { get; set; } = null!;
    public virtual ICollection<ProductImage> ProductImages { get; set; } = new List<ProductImage>();

    public string Description { get; set; } = null!;

    public decimal? Price { get; set; }

    public int StockQuentity { get; set; }

    public virtual Category? Category { get; set; } 
}
