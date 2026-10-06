using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace DataAcess.Entity;

public partial class Category
{
    public int CategoryId { get; set; }

    public string CategoryName { get; set; } = null!;

    public string? Description { get; set; }
    [JsonIgnore]

    public ICollection<Product> Products { get; set; } = new List<Product>();
}
