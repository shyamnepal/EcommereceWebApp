using System;
using System.Collections.Generic;

namespace DataAcess.ViewModel;
public partial class CategoryViewModel
{
    public int CategoryId { get; set; }

    public string CategoryName { get; set; } = null!;

    public string? Description { get; set; }

    //public virtual ICollection<ProductViewModel> Products { get; set; } = new List<ProductViewModel>();
}
