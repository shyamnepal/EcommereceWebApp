using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DataAcess.Entity.OrderAggregate
{
    [NotMapped]
    public class ProductItemOrdered
    {
        public ProductItemOrdered()
        {
            
        }
        public ProductItemOrdered(int productItemId, string productName, ICollection<ProductImage> pictureUrl)
        {
            ProductItemId = productItemId;
            ProductName = productName;
            PictureUrl = pictureUrl;
        }
        [Key]
        public int ProductItemId { get; set; }
        public string ProductName { get; set; }
        public ICollection<ProductImage> PictureUrl { get; set; }

    }
}
