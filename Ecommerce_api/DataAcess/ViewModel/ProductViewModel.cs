using DataAcess.Entity;
using System;
using System.Collections.Generic;

namespace DataAcess.ViewModel;

public partial class ProductViewModel
{


    public int? ProductId { get; set; }

    public int? CategoryId { get; set; }

    public string ProductName { get; set; } = null!;
    public ICollection<ProductImage> ProductImages { get; set; } = new List<ProductImage>();
    public string Description { get; set; } = null!;

    public decimal? Price { get; set; }

    public int StockQuentity { get; set; }
    public Category? Category { get; set; }
    //public ICollection<IFormFile> image{get; set;}

    //public virtual CategoryViewModel? Category { get; set; }
}
