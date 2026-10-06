using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace DataAcess.Entity
{
    public class ProductImage
    {
        [Key]
        public int ImageId { get; set; }
        public int ProductId { get; set; }
        public string ImageUrl { get; set; }
        public string ImageAltText { get; set; }
        public DateTime createdAt { get; set; } = DateTime.Now;
        [JsonIgnore]
        public Product product { get; set; }
        public bool IsDeleted { get; set; }
    }
}
